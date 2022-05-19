import { Form, Prisma, Status, User } from "@prisma/client";
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
    signedBy,
    quantityReceived,
    quantityGrouped,
    processedBy,
    processedAt,
    processingOperationDone,
    processingOperationDescription,
    noTraceability,
    transporterNumberPlate,
    transporterCustomInfo,
    currentTransporterSiret,
    forwardedInId,
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
 * Duplicate the content of a form into a new DRAFT form
 * A new readable ID is generated and some fields which
 * are not duplicable are omitted
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
  if (fullForm.forwardedIn) {
    newFormInput.forwardedIn = {
      create: getDuplicateFormInput(user, fullForm.forwardedIn)
    };
  }

  if (fullForm.intermediaries) {
    newFormInput.intermediaries = {
      createMany: {
        data: fullForm.intermediaries.map(int => ({
          siret: int.siret,
          address: int.address,
          vatNumber: int.vatNumber,
          name: int.name,
          contact: int.contact,
          phone: int.phone,
          mail: int.mail
        })),
        skipDuplicates: true
      }
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
