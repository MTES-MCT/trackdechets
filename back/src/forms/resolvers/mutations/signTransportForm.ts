import { EmitterType, Form, Prisma, Status } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import {
  MutationResolvers,
  Form as GraphQLForm,
  MutationSignTransportFormArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound, getFullForm } from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { checkCanSignFor, hasSignatureAutomation } from "../../permissions";
import { expandFormFromDb } from "../../converter";
import { getFormRepository } from "../../repository";
import { getTransporterCompanyOrgId } from "../../../common/constants/companySearchHelpers";
import { runInTransaction } from "../../../common/repository/helper";

/**
 * Common function for signing
 */
const signedByTransporterFn = async (
  user: Express.User,
  args: MutationSignTransportFormArgs,
  existingForm: Form
) => {
  if (existingForm.emitterType === EmitterType.APPENDIX1) {
    throw new UserInputError(
      "Impossible de signer le transport d'un bordereau chapeau. C'est en signant les bordereaux d'annexe 1 que le statut de ce bordereau évoluera."
    );
  }
  await checkCanSignFor(
    getTransporterCompanyOrgId(existingForm),
    user,
    args.securityCode
  );
  const formUpdateInput = {
    takenOverAt: args.input.takenOverAt,
    takenOverBy: args.input.takenOverBy,
    transporterNumberPlate:
      args.input.transporterNumberPlate ?? existingForm.transporterNumberPlate,

    currentTransporterSiret: getTransporterCompanyOrgId(existingForm),

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

      await update(
        { id: appendix1ContainerId },
        {
          status: transitionForm(existingForm, {
            type: EventType.SignedByTransporter,
            formUpdateInput
          }),
          emittedAt: formUpdateInput.sentAt,
          sentAt: formUpdateInput.sentAt
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
    const isAppendix1WithAutomaticSignature =
      existingForm.emitterType === EmitterType.APPENDIX1_PRODUCER &&
      (existingForm.emittedByEcoOrganisme ||
        (await hasSignatureAutomation({
          signedBy: existingForm.transporterCompanySiret,
          signedFor: existingForm.emitterCompanySiret
        })));

    // no signature needed for
    // - individuals
    // - foreign ships
    // - appendix1 when signatureAutomation is enabled for the transporter, or the form has an eco organisme
    if (
      isPrivateIndividual ||
      isForeignShip ||
      isAppendix1WithAutomaticSignature
    ) {
      return signedByTransporterFn(user, args, existingForm);
    } else {
      throw new ForbiddenError(
        "Vous n'êtes pas autorisé à signer ce bordereau"
      );
    }
  },
  [Status.SIGNED_BY_PRODUCER]: async (user, args, existingForm) =>
    signedByTransporterFn(user, args, existingForm),
  [Status.SIGNED_BY_TEMP_STORER]: async (user, args, existingForm) => {
    const existingFullForm = await getFullForm(existingForm);

    await checkCanSignFor(
      getTransporterCompanyOrgId(existingFullForm.forwardedIn),
      user,
      args.securityCode
    );

    const formUpdateInput: Prisma.FormUpdateInput = {
      forwardedIn: {
        update: {
          status: Status.SENT,
          takenOverAt: args.input.takenOverAt,
          takenOverBy: args.input.takenOverBy,
          transporterNumberPlate:
            args.input.transporterNumberPlate ??
            existingFullForm.forwardedIn.transporterNumberPlate,

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
