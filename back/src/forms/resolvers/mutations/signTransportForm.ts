import { EmitterType, Form, Prisma, Status } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import {
  MutationResolvers,
  Form as GraphQLForm,
  MutationSignTransportFormArgs,
  PackagingInfo
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getFirstTransporter,
  getFirstTransporterSync,
  getFormOrFormNotFound,
  getFullForm
} from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { checkCanSignFor, hasSignatureAutomation } from "../../permissions";
import { expandFormFromDb } from "../../converter";
import { getFormRepository } from "../../repository";
import { getTransporterCompanyOrgId } from "../../../common/constants/companySearchHelpers";
import { runInTransaction } from "../../../common/repository/helper";
import { sumPackagingInfos } from "../../repository/helper";
import { validateBeforeTransport } from "../../validation";
import { Permission } from "../../../permissions";

/**
 * Common function for signing
 */
const signTransportFn = async (
  user: Express.User,
  args: MutationSignTransportFormArgs,
  existingForm: Form
) => {
  if (existingForm.emitterType === EmitterType.APPENDIX1) {
    throw new UserInputError(
      "Impossible de signer le transport d'un bordereau chapeau. C'est en signant les bordereaux d'annexe 1 que le statut de ce bordereau évoluera."
    );
  }
  const transporter = await getFirstTransporter(existingForm);

  await checkCanSignFor(
    getTransporterCompanyOrgId(transporter)!,
    user,
    Permission.BsdCanSignTransport,
    args.securityCode
  );

  console.log(
    JSON.stringify(
      {
        ...existingForm,
        ...(args.input.transporterNumberPlate
          ? {
              transporterNumberPlate: args.input.transporterNumberPlate
            }
          : {})
      },
      null,
      4
    )
  );

  await validateBeforeTransport({
    ...existingForm,
    ...transporter,
    ...(args.input.transporterNumberPlate
      ? {
          transporterNumberPlate: args.input.transporterNumberPlate
        }
      : {})
  });

  const transporterUpdate: Prisma.BsddTransporterUpdateWithoutFormInput = {
    takenOverAt: args.input.takenOverAt, // takenOverAt is duplicated between Form and BsddTransporter
    takenOverBy: args.input.takenOverBy, // takenOverBy is duplicated between Form and BsddTransporter
    ...(args.input.transporterNumberPlate
      ? {
          transporterNumberPlate: args.input.transporterNumberPlate
        }
      : {})
  };

  const formUpdateInput: Prisma.FormUpdateInput = {
    takenOverAt: args.input.takenOverAt,
    takenOverBy: args.input.takenOverBy,
    ...(transporter
      ? {
          transporters: {
            update: {
              where: { id: transporter.id },
              data: transporterUpdate
            }
          }
        }
      : {}),
    currentTransporterOrgId: getTransporterCompanyOrgId(transporter),
    // The following fields are deprecated
    // but we need to fill them until we remove them completely
    signedByTransporter: true,
    sentAt: args.input.takenOverAt,
    sentBy: existingForm.emittedBy,

    // If it's an appendix1 and the emitter hasn't signed, TD automatically "signs" for him
    ...(!existingForm.emittedAt &&
      existingForm.emitterType === EmitterType.APPENDIX1_PRODUCER && {
        emittedAt: args.input.takenOverAt,
        emittedBy: "Signature automatique Trackdéchets"
      })
  };

  const updatedForm = await runInTransaction(async transaction => {
    const { update, updateAppendix2Forms, findGroupedFormsById, findUnique } =
      getFormRepository(user, transaction);

    const updatedForm = await update(
      { id: existingForm.id },
      {
        status: transitionForm(existingForm, {
          type: EventType.SignedByTransporter,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    if (existingForm.emitterType === EmitterType.APPENDIX2) {
      const appendix2Forms = await findGroupedFormsById(existingForm.id);
      await updateAppendix2Forms(appendix2Forms);
    }

    if (existingForm.emitterType === EmitterType.APPENDIX1_PRODUCER) {
      const include = {
        include: { groupedIn: { include: { nextForm: true } } }
      };
      const { groupedIn } = await findUnique<typeof include>(
        { id: existingForm.id },
        include
      );
      const appendix1ContainerId = groupedIn?.[0]?.nextFormId;
      if (!appendix1ContainerId) {
        throw new ForbiddenError(
          "Impossible de signer un bordereau d'annexe 1 si cette annexe n'est pas rattachée à un bordereau chapeau."
        );
      }

      if (groupedIn[0].nextForm.status === Status.DRAFT) {
        throw new ForbiddenError(
          "Impossible de signer le transport d'un bordereau d'annexe 1 quand le bordereau chapeau est en brouillon. Veuillez d'abord sceller le bordereau chapeau."
        );
      }

      // During transporter signature, we recompute the total packaging infos
      // But we only use the current form + forms picked up by the transporter to compute this quantity
      const appendix1Forms = await findGroupedFormsById(appendix1ContainerId);
      const wasteDetailsPackagingInfos = appendix1Forms
        .filter(form => existingForm.id === form.id || form.takenOverAt)
        .map(form => form.wasteDetailsPackagingInfos as PackagingInfo[]);

      const appendix1ContainerTransporter = await getFirstTransporter({
        id: appendix1ContainerId
      });

      await update(
        { id: appendix1ContainerId },
        {
          status: transitionForm(existingForm, {
            type: EventType.SignedByTransporter,
            formUpdateInput
          }),
          emittedAt: formUpdateInput.sentAt,
          sentAt: formUpdateInput.sentAt,
          takenOverAt: formUpdateInput.takenOverAt,
          takenOverBy: formUpdateInput.takenOverBy,
          ...(appendix1ContainerTransporter
            ? {
                transporters: {
                  update: {
                    where: { id: appendix1ContainerTransporter.id },
                    data: transporterUpdate
                  }
                }
              }
            : {}),
          wasteDetailsPackagingInfos: sumPackagingInfos(
            wasteDetailsPackagingInfos
          ),
          wasteDetailsQuantity: appendix1Forms
            .map(form => form.wasteDetailsQuantity ?? 0)
            .reduce((sum, quantity) => sum + quantity, 0)
        }
      );
    }
    return updatedForm;
  });

  return expandFormFromDb(updatedForm);
};

const signatures: Partial<
  Record<
    Status,
    (
      user: Express.User,
      args: MutationSignTransportFormArgs,
      existingForm: Form
    ) => Promise<GraphQLForm>
  >
> = {
  [Status.CANCELED]: () => {
    throw new ForbiddenError(
      "Vous ne pouvez pas faire cette action, ce bordereau a été annulé"
    );
  },
  [Status.SEALED]: async (user, args, existingForm) => {
    const isPrivateIndividual =
      existingForm.emitterIsPrivateIndividual === true;
    const isForeignShip =
      existingForm.emitterIsForeignShip === true &&
      existingForm.emitterCompanyOmiNumber;
    const transporter = await getFirstTransporter(existingForm);
    const isAppendix1WithAutomaticSignature =
      existingForm.emitterType === EmitterType.APPENDIX1_PRODUCER &&
      (existingForm.ecoOrganismeSiret ||
        (transporter?.transporterCompanySiret &&
          existingForm.emitterCompanySiret &&
          (await hasSignatureAutomation({
            signedBy: transporter?.transporterCompanySiret,
            signedFor: existingForm.emitterCompanySiret
          }))));

    // no signature needed for
    // - individuals
    // - foreign ships
    // - appendix1 when signatureAutomation is enabled for the transporter, or the form has an eco organisme
    if (
      isPrivateIndividual ||
      isForeignShip ||
      isAppendix1WithAutomaticSignature
    ) {
      return signTransportFn(user, args, existingForm);
    } else {
      throw new ForbiddenError(
        "Vous n'êtes pas autorisé à signer ce bordereau"
      );
    }
  },
  [Status.SIGNED_BY_PRODUCER]: async (user, args, existingForm) =>
    signTransportFn(user, args, existingForm),
  [Status.SIGNED_BY_TEMP_STORER]: async (user, args, existingForm) => {
    const existingFullForm = await getFullForm(existingForm);

    const transporter = getFirstTransporterSync(existingFullForm.forwardedIn!);
    await checkCanSignFor(
      getTransporterCompanyOrgId(transporter)!,
      user,
      Permission.BsdCanSignTransport,
      args.securityCode
    );

    const formUpdateInput: Prisma.FormUpdateInput = {
      forwardedIn: {
        update: {
          status: Status.SENT,
          takenOverAt: args.input.takenOverAt,
          takenOverBy: args.input.takenOverBy,
          transporters: {
            updateMany: {
              data: {
                transporterNumberPlate:
                  args.input.transporterNumberPlate ??
                  transporter?.transporterNumberPlate
              },
              where: { number: 1 }
            }
          },
          // The following fields are deprecated
          // but we need to fill them until we remove them completely
          signedByTransporter: true,
          sentAt: args.input.takenOverAt,
          sentBy: existingForm.emittedBy
        }
      }
    };

    const updatedForm = await getFormRepository(user).update(
      { id: existingFullForm.id },
      {
        status: transitionForm(existingFullForm, {
          type: EventType.MarkAsResent,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    return expandFormFromDb(updatedForm);
  }
};

const signTransportForm: MutationResolvers["signTransportForm"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const form = await getFormOrFormNotFound({ id: args.id });
  const sign = signatures[form.status];

  if (sign == null) {
    throw new UserInputError(
      `Ce bordereau n'en est pas à cette étape de signature`
    );
  }

  return sign(user, args, form);
};

export default signTransportForm;
