import {
  Form,
  prisma,
  Status,
  TemporaryStorageDetail,
  User
} from "../../../generated/prisma-client";
import { expandFormFromDb } from "../../form-converter";
import { getReadableId } from "../../readable-id";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound, getFullForm } from "../../database";
import { getFullUser } from "../../../users/database";
import { isFormContributor } from "../../permissions";
import { NotFormContributor } from "../../errors";

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

    ...rest
  }: Form
) {
  return prisma.createForm({
    ...rest,
    readableId: await getReadableId(),
    status: "DRAFT",
    owner: { connect: { id: user.id } }
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
  return prisma.updateForm({
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

  const fullUser = await getFullUser(user);
  const fullExistingForm = await getFullForm(existingForm);

  if (!isFormContributor(fullUser, fullExistingForm)) {
    throw new NotFormContributor();
  }

  const newForm = await duplicateForm(user, existingForm);

  if (fullExistingForm.temporaryStorage) {
    await duplicateTemporaryStorageDetail(
      newForm,
      fullExistingForm.temporaryStorage
    );
  }

  // create statuslog when form is created
  await prisma.createStatusLog({
    form: { connect: { id: newForm.id } },
    user: { connect: { id: user.id } },
    status: newForm.status as Status,
    updatedFields: {},
    loggedAt: new Date()
  });

  return expandFormFromDb(newForm);
};

export default duplicateFormResolver;
