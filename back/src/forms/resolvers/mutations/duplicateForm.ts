import {
  Form,
  Prisma,
  Status,
  TemporaryStorageDetail,
  User
} from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { eventEmitter, TDEvent } from "../../../events/emitter";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../form-converter";
import { checkCanDuplicate } from "../../permissions";
import getReadableId from "../../readableId";
import { getFormRepository } from "../../repository";

/**
 * Get the input to duplicate a form by stripping the properties that should not be copied.
 *
 * @param {User} user user that should own the duplicated form
 * @param {Form} form the form to duplicate
 */
function getDuplicateFormInput(
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
    emittedAt,
    emittedBy,
    emittedByEcoOrganisme,
    takenOverAt,
    takenOverBy,
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
): Prisma.FormCreateInput {
  return {
    ...rest,
    readableId: getReadableId(),
    status: "DRAFT" as Status,
    owner: { connect: { id: user.id } }
  };
}

/**
 * Duplicate a temporary storage detail by stripping
 * the properties that should not be copied.
 *
 * @param {Form} form the form to which the duplicated temporary storage detail should be linked to
 * @param {TemporaryStorageDetail} temporaryStorageDetail the temporary storage detail to duplicate
 */
function getDuplicateTemporaryStorageDetail({
  id,
  tempStorerQuantityType,
  tempStorerQuantityReceived,
  tempStorerWasteAcceptationStatus,
  tempStorerWasteRefusalReason,
  tempStorerReceivedAt,
  tempStorerReceivedBy,
  tempStorerSignedAt,
  transporterNumberPlate,
  emittedAt,
  emittedBy,
  takenOverAt,
  takenOverBy,
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

  const existingForm = await getFormOrFormNotFound({ id });

  await checkCanDuplicate(user, existingForm);

  const formRepository = getFormRepository(user);

  const newFormInput = getDuplicateFormInput(user, existingForm);

  const fullForm = await formRepository.findFullFormById(existingForm.id);
  if (fullForm.temporaryStorageDetail) {
    const temporaryStorageDetailCreateInput =
      getDuplicateTemporaryStorageDetail(fullForm.temporaryStorageDetail);
    newFormInput.temporaryStorageDetail = {
      create: temporaryStorageDetailCreateInput
    };
  }

  const newForm = await formRepository.create(newFormInput, {
    duplicate: { id: existingForm.id }
  });

  eventEmitter.emit(TDEvent.CreateForm, {
    previousNode: null,
    node: newForm,
    updatedFields: {},
    mutation: "CREATED"
  });

  return expandFormFromDb(newForm);
};

export default duplicateFormResolver;
