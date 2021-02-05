import { Status, TemporaryStorageDetail } from "@prisma/client";
import prisma from "../../../prisma";

import { expandFormFromDb } from "../../form-converter";
import getReadableId from "../../readableId";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { checkCanDuplicate } from "../../permissions";
import { eventEmitter, TDEvent } from "../../../events/emitter";
import { indexForm } from "../../elastic";
import { FullForm } from "../../types";

function getDuplicatableFormFields({
  id,
  readableId,
  customId,
  isDeleted,
  isImportedFromPaper,
  createdAt,
  updatedAt,
  signedByTransporter,
  status,
  sentAt,
  sentBy,
  isAccepted,
  wasteAcceptationStatus,
  wasteRefusalReason,
  receivedBy,
  receivedAt,
  signedAt,
  quantityReceived,
  processedBy,
  processedAt,
  processingOperationDone,
  processingOperationDescription,
  noTraceability,
  transporterNumberPlate,
  transporterCustomInfo,
  currentTransporterSiret,
  temporaryStorageDetailId,
  appendix2RootFormId,
  ownerId,
  temporaryStorageDetail,
  transportSegments,

  ...rest
}: FullForm) {
  return rest;
}

function getDuplicatableTemporaryStorageFields({
  id,
  tempStorerQuantityType,
  tempStorerQuantityReceived,
  tempStorerWasteAcceptationStatus,
  tempStorerWasteRefusalReason,
  tempStorerReceivedAt,
  tempStorerReceivedBy,
  tempStorerSignedAt,
  transporterNumberPlate,
  signedByTransporter,
  signedBy,
  signedAt,

  ...rest
}: TemporaryStorageDetail) {
  return rest;
}

/**
 * Duplicate the content of a form into a new DRAFT form
 * A new readable ID is generated and some fields which
 * are not duplicable are omitted
 * @param formId
 * @param userId
 */
const duplicateFormResolver: MutationResolvers["duplicateForm"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  // TODO: ideally we would use prisma's "include" option
  // perhaps we should refactor getFormOrFormNotFound a bit
  const existingForm = await getFormOrFormNotFound({ id });
  const existingTemporaryStorageDetail = existingForm.temporaryStorageDetailId
    ? await prisma.temporaryStorageDetail.findUnique({
        where: {
          id: existingForm.temporaryStorageDetailId
        }
      })
    : null;
  const fullExistingForm = {
    ...existingForm,
    temporaryStorageDetail: existingTemporaryStorageDetail,
    transportSegments: []
  };

  // TODO: transportSegments are not queried, which means a multimodal transporter cannot duplicate that form
  await checkCanDuplicate(user, fullExistingForm);

  const newForm = await prisma.form.create({
    data: {
      ...getDuplicatableFormFields(fullExistingForm),
      temporaryStorageDetail: fullExistingForm.temporaryStorageDetail
        ? {
            create: getDuplicatableTemporaryStorageFields(
              fullExistingForm.temporaryStorageDetail
            )
          }
        : undefined,
      readableId: getReadableId(),
      status: "DRAFT",
      owner: { connect: { id: user.id } }
    },
    include: {
      temporaryStorageDetail: true,
      transportSegments: true
    }
  });

  eventEmitter.emit(TDEvent.CreateForm, {
    previousNode: null,
    node: newForm,
    updatedFields: {},
    mutation: "CREATED"
  });

  await prisma.statusLog.create({
    data: {
      form: { connect: { id: newForm.id } },
      user: { connect: { id: user.id } },
      status: newForm.status as Status,
      authType: user.auth,
      updatedFields: {},
      loggedAt: new Date()
    }
  });
  await indexForm(newForm);

  return expandFormFromDb(newForm);
};

export default duplicateFormResolver;
