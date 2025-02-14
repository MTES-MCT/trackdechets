import { CompanyType, EmitterType, Form, Prisma, Status } from "@prisma/client";
import type {
  MutationResolvers,
  Form as GraphQLForm,
  MutationSignTransportFormArgs,
  PackagingInfo
} from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getFirstTransporter,
  getFirstTransporterSync,
  getFormOrFormNotFound,
  getFullForm,
  getTransporters
} from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { checkCanSignFor, hasSignatureAutomation } from "../../permissions";
import { getAndExpandFormFromDb } from "../../converter";
import { getFormRepository } from "../../repository";
import { getTransporterCompanyOrgId } from "@td/constants";
import { runInTransaction } from "../../../common/repository/helper";
import { sumPackagingInfos } from "../../repository/helper";
import { validateBeforeTransport, plateSchemaFn } from "../../validation";
import { Permission } from "../../../permissions";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { recipifyFormInput } from "../../recipify";
import { ForbiddenError, UserInputError } from "../../../common/errors";
import { prisma } from "@td/prisma";

export async function getFormReceiptField(transporter) {
  const recipifiedTransporter = await recipifyFormInput({
    transporter: {
      isExemptedOfReceipt: transporter.transporterIsExemptedOfReceipt,
      receipt: transporter.transporterReceipt,
      validityLimit: transporter.transporterValidityLimit,
      department: transporter.transporterDepartment,
      company: {
        siret: transporter.transporterCompanySiret,
        vatNumber: transporter.transporterCompanyVatNumber
      }
    }
  });
  const receiptFields = {
    transporterReceipt: recipifiedTransporter.transporter?.receipt,
    transporterDepartment: recipifiedTransporter.transporter?.department,
    transporterValidityLimit: recipifiedTransporter.transporter?.validityLimit,
    transporterIsExemptedOfReceipt:
      recipifiedTransporter.transporter?.isExemptedOfReceipt
  };
  return receiptFields;
}

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

  const transporters = await getTransporters(existingForm);

  if (transporters.length === 0) {
    throw new UserInputError(
      "Aucun transporteur n'a été renseigné sur le bordereau"
    );
  }

  // Retourne le premier transporteur (dans l'ordre de la numérotation) qui n'a
  // pas encore signé le bordereau. Pour être compatible avec le workflow multi-modal
  // v1 (un transporteur ne peut pas signer un bordereau tant que `readyToTakeOver=false`)
  // on vérifie que `readyToTakeOver=true`
  const signingTransporterIdx = transporters.findIndex(
    t => t.readyToTakeOver && !t.takenOverAt
  );
  if (signingTransporterIdx === -1) {
    throw new UserInputError(
      "Tous les transporteurs présents sur le bordereau ont déjà signé. " +
        "Le bordereau est désormais en attente de réception"
    );
  }

  const signingTransporter = transporters[signingTransporterIdx];

  const signingTransporterOrgId =
    getTransporterCompanyOrgId(signingTransporter)!;

  await checkCanSignFor(
    signingTransporterOrgId,
    user,
    Permission.BsdCanSignTransport,
    args.securityCode
  );

  const receiptFields = await getFormReceiptField(signingTransporter!);

  const transportersForValidation = [...transporters];
  // Prend en compte la plaque d'immatriculation et le mode
  // de transport envoyés dans l'input de signature pour
  // la validation des données
  transportersForValidation[signingTransporterIdx] = {
    ...transportersForValidation[signingTransporterIdx],
    ...(receiptFields as any) // FIXME fix typing of getFormReceiptField
  };
  if (args.input?.transporterNumberPlate) {
    transportersForValidation[signingTransporterIdx].transporterNumberPlate =
      args.input?.transporterNumberPlate;
  }
  if (args.input?.transporterTransportMode !== undefined) {
    transportersForValidation[signingTransporterIdx].transporterTransportMode =
      args.input?.transporterTransportMode;
  }

  await validateBeforeTransport(
    {
      ...existingForm,
      transporters: transportersForValidation
    },
    signingTransporterOrgId
  );

  const formUpdateInput: Prisma.FormUpdateInput = {};

  if (signingTransporter.number === 1) {
    // fill takenOverAt and takenOverBy at the Form level for retro-compatibility
    formUpdateInput.takenOverAt = args.input.takenOverAt;
    formUpdateInput.takenOverBy = args.input.takenOverBy;
    // The following fields are deprecated
    // but we need to fill them until we remove them completely
    formUpdateInput.signedByTransporter = true;
    formUpdateInput.sentAt = args.input.takenOverAt;
    formUpdateInput.sentBy = existingForm.emittedBy;
  }

  const transporterData: Prisma.BsddTransporterUpdateWithoutFormInput = {
    takenOverAt: args.input.takenOverAt,
    takenOverBy: args.input.takenOverBy,
    ...(args.input.transporterNumberPlate
      ? {
          transporterNumberPlate: args.input.transporterNumberPlate
        }
      : {}),
    ...(args.input.transporterTransportMode
      ? {
          transporterTransportMode: args.input.transporterTransportMode
        }
      : {}),
    ...receiptFields
  };

  // Update signing transporter
  const transportersUpdateInput: Prisma.BsddTransporterUpdateManyWithoutFormNestedInput =
    {
      update: {
        where: { id: signingTransporter.id },
        data: transporterData
      }
    };

  formUpdateInput.transporters = transportersUpdateInput;
  formUpdateInput.currentTransporterOrgId = signingTransporterOrgId;

  if (
    !existingForm.emittedAt &&
    existingForm.emitterType === EmitterType.APPENDIX1_PRODUCER
  ) {
    // If it's an appendix1 and the emitter hasn't signed, TD automatically "signs" for him
    formUpdateInput.emittedAt = args.input.takenOverAt;
    formUpdateInput.emittedBy = "Signature automatique Trackdéchets";
  }

  const updatedForm = await runInTransaction(async transaction => {
    const { update, findGroupedFormsById, findUnique } = getFormRepository(
      user,
      transaction
    );

    const updatedForm = await update(
      { id: existingForm.id, status: existingForm.status },
      {
        status: transitionForm(existingForm, {
          type: EventType.SignedByTransporter,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    if (existingForm.emitterType === EmitterType.APPENDIX1_PRODUCER) {
      const include = {
        include: { groupedIn: { include: { nextForm: true } } }
      };
      const { groupedIn } = await findUnique<typeof include>(
        { id: existingForm.id },
        include
      );
      const appendix1ContainerId = groupedIn?.[0]?.nextFormId;
      const appendix1ContainerTakenOverAt =
        groupedIn?.[0]?.nextForm.takenOverAt;
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
          ...(!appendix1ContainerTakenOverAt // Only the first appendix 1 signature should fill this field
            ? { takenOverAt: formUpdateInput.takenOverAt }
            : undefined),
          takenOverBy: formUpdateInput.takenOverBy,
          ...(appendix1ContainerTransporter
            ? {
                transporters: {
                  update: {
                    where: { id: appendix1ContainerTransporter.id },
                    data: transporterData
                  }
                }
              }
            : {}),
          wasteDetailsPackagingInfos: sumPackagingInfos(
            wasteDetailsPackagingInfos
          ),
          wasteDetailsQuantity: appendix1Forms
            .map(form => form.wasteDetailsQuantity?.toNumber() ?? 0)
            .reduce((sum, quantity) => sum + quantity, 0)
        }
      );

      if (args.input?.transporterNumberPlate && appendix1Forms?.length > 0) {
        // At any given time, all bsds from an Annexe1 must have the same plates
        const ids = appendix1Forms.map(form => form.id);

        // Update their plates
        await transaction.bsddTransporter.updateMany({
          where: {
            formId: { in: ids }
          },
          data: {
            transporterNumberPlate: args.input.transporterNumberPlate
          }
        });

        // Update ES
        appendix1Forms
          .map(f => f.readableId)
          .forEach(readableId => {
            enqueueUpdatedBsdToIndex(readableId);
          });
      }
    }

    return updatedForm;
  });

  return getAndExpandFormFromDb(updatedForm.id);
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
    const hasSkippableEmitterSignature =
      await canTransporterSignWithoutEmitterSignature(existingForm);

    // no signature needed for
    // - individuals
    // - foreign ships
    // - and sometimes with appendix1
    if (isPrivateIndividual || isForeignShip || hasSkippableEmitterSignature) {
      return signTransportFn(user, args, existingForm);
    } else {
      throw new ForbiddenError(
        "Vous n'êtes pas autorisé à signer ce bordereau"
      );
    }
  },
  [Status.SIGNED_BY_PRODUCER]: async (user, args, existingForm) =>
    signTransportFn(user, args, existingForm),
  // Signature of transporter N > 1
  [Status.SENT]: async (user, args, existingForm) =>
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

    await plateSchemaFn().validate(
      {
        transporterNumberPlate:
          args.input.transporterNumberPlate ??
          transporter?.transporterNumberPlate
      },
      {
        abortEarly: false
      }
    );

    const updatedForm = await getFormRepository(user).update(
      { id: existingFullForm.id, status: existingFullForm.status },
      {
        status: transitionForm(existingFullForm, {
          type: EventType.MarkAsResent,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    return getAndExpandFormFromDb(updatedForm.id);
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

async function canTransporterSignWithoutEmitterSignature(existingForm: Form) {
  if (existingForm.emitterType !== EmitterType.APPENDIX1_PRODUCER) {
    return false;
  }

  if (existingForm.ecoOrganismeSiret && existingForm.emitterCompanySiret) {
    const emitterProfile = await prisma.company.findUnique({
      where: { siret: existingForm.emitterCompanySiret }
    });

    if (
      !emitterProfile ||
      [CompanyType.WASTEPROCESSOR, CompanyType.COLLECTOR].every(
        profile => !emitterProfile.companyTypes.includes(profile)
      )
    ) {
      return true;
    }
  }

  const transporter = await getFirstTransporter(existingForm);
  if (
    transporter?.transporterCompanySiret &&
    existingForm.emitterCompanySiret
  ) {
    return hasSignatureAutomation({
      signedBy: transporter?.transporterCompanySiret,
      signedFor: existingForm.emitterCompanySiret
    });
  }

  return false;
}

export default signTransportForm;
