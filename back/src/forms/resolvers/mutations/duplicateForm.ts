import { Status, Form, TemporaryStorageDetail, User } from "@prisma/client";
import prisma from "../../../prisma";

import { expandFormFromDb } from "../../form-converter";
import { getReadableId } from "../../readable-id";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { checkCanDuplicate } from "../../permissions";
import { eventEmitter, TDEvent } from "../../../events/emitter";

/**
 * Duplicate a form by stripping the properties that should not be copied.
 *
 * @param {User} user user that should own the duplicated form
 * @param {Form} form the form to duplicate
 */
async function duplicateForm(
  user: User,
  {
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

    ...rest
  }: Form
) {
  return prisma.form.create({
    data: {
      ...rest,
      readableId: await getReadableId(),
      status: "DRAFT",
      owner: { connect: { id: user.id } }
    }
  });
}

/**
 * Duplicate a temporary storage detail by stripping
 * the properties that should not be copied.
 *
 * @param {Form} form the form to which the duplicated temporary storage detail should be linked to
 * @param {TemporaryStorageDetail} temporaryStorageDetail the temporary storage detail to duplicate
 */
function duplicateTemporaryStorageDetail(
  form: Form,
  {
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
  }: TemporaryStorageDetail
) {
  return prisma.form.update({
    where: {
      id: form.id
    },
    data: {
      temporaryStorageDetail: {
        create: {
          ...rest
        }
      }
    }
  });
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

  const existingForm = await getFormOrFormNotFound({ id });

  await checkCanDuplicate(user, existingForm);

  const newForm = await duplicateForm(user, existingForm);

  const temporaryStorageDetail = await prisma.form
    .findUnique({ where: { id: existingForm.id } })
    .temporaryStorageDetail();

  if (temporaryStorageDetail) {
    await duplicateTemporaryStorageDetail(newForm, temporaryStorageDetail);
  }

  eventEmitter.emit(TDEvent.CreateForm, {
    previousNode: null,
    node: newForm,
    updatedFields: {},
    mutation: "CREATED"
  });

  // create statuslog when form is created
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

  return expandFormFromDb(newForm);
};

export default duplicateFormResolver;
