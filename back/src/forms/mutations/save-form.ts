import { flattenObjectForDb, unflattenObjectFromDb } from "../form-converter";
import { getReadableId } from "../readable-id";
import {
  Form as PrismaForm,
  FormUpdateInput,
  FormCreateInput,
  Status,
  prisma,
  EcoOrganisme
} from "../../generated/prisma-client";
import { getUserCompanies } from "../../companies/queries";
import { ForbiddenError } from "apollo-server-express";
import {
  MutationSaveFormArgs,
  FormInput,
  Form
} from "../../generated/graphql/types";

export async function saveForm(
  userId: string,
  { formInput }: MutationSaveFormArgs
): Promise<Form> {
  const { id, ...formContent } = formInput;
  const form = flattenObjectForDb(formContent);

  await checkThatUserIsPartOftheForm(userId, { ...form, id });

  if (id) {
    // {disconnect: true} fails if there is no relation, so we have to check ecoOrganisme before
    // calling prims.form().ecoOrganisme() was hard to mock, we use another query for the same puppose
    const existingEcoOrganisme = await prisma.forms({
      where: { id, ecoOrganisme: { id_not: null } }
    });

    const temporaryStorageDetail = await prisma
      .form({ id })
      .temporaryStorageDetail();

    const updatedForm = await prisma.updateForm({
      where: { id },
      data: {
        ...(form as FormUpdateInput),
        appendix2Forms: { set: formContent.appendix2Forms },
        ecoOrganisme: {
          ...(formContent.ecoOrganisme?.id
            ? { connect: formContent.ecoOrganisme }
            : !!existingEcoOrganisme.length
            ? { disconnect: true }
            : null)
        },
        temporaryStorageDetail: {
          // TODO look for a more elagant way to handle that
          ...(formContent.recipient?.isTempStorage &&
          temporaryStorageDetail != null
            ? { update: flattenObjectForDb(formContent.temporaryStorageDetail) }
            : formContent.recipient?.isTempStorage &&
              formContent.temporaryStorageDetail != null
            ? { create: flattenObjectForDb(formContent.temporaryStorageDetail) }
            : temporaryStorageDetail != null
            ? { disconnect: true }
            : null)
        }
      }
    });
    return unflattenObjectFromDb(updatedForm);
  }

  const newForm = await prisma.createForm({
    ...(form as FormCreateInput),
    appendix2Forms: { connect: formContent.appendix2Forms },
    ...(formContent.ecoOrganisme?.id && {
      ecoOrganisme: { connect: formContent.ecoOrganisme }
    }),
    temporaryStorageDetail: {
      ...(formContent.recipient.isTempStorage && {
        create: formContent.temporaryStorageDetail
          ? flattenObjectForDb(formContent.temporaryStorageDetail)
          : {}
      })
    },
    readableId: await getReadableId(),
    owner: { connect: { id: userId } }
  });
  // create statuslog when and only when form is created
  await prisma.createStatusLog({
    form: { connect: { id: newForm.id } },
    user: { connect: { id: userId } },
    status: newForm.status as Status,
    updatedFields: {},
    loggedAt: new Date()
  });
  return unflattenObjectFromDb(newForm);
}

const formSiretsGetter = (
  form: Partial<PrismaForm> & { ecoOrganisme?: EcoOrganisme }
) => [
  form.emitterCompanySiret,
  form.traderCompanySiret,
  form.recipientCompanySiret,
  form.transporterCompanySiret,
  form.ecoOrganisme?.siret
];

async function checkThatUserIsPartOftheForm(userId: string, form: FormInput) {
  const isEdition = form.id != null;
  const ecoOrganisme = form.ecoOrganisme?.id
    ? await prisma.ecoOrganisme({
        id: form.ecoOrganisme?.id
      })
    : null;

  const formSirets = formSiretsGetter({ ...form, ecoOrganisme });
  const hasPartialFormInput = formSirets.some(siret => siret == null);

  if (isEdition && hasPartialFormInput) {
    const savedForm = await prisma.form({ id: form.id });
    const savedEcoOrganisme = await prisma.form({ id: form.id }).ecoOrganisme();

    const savedFormSirets = formSiretsGetter({
      ...savedForm,
      ecoOrganisme: savedEcoOrganisme
    });
    formSirets.push(...savedFormSirets);
  }

  const userCompanies = await getUserCompanies(userId);
  const userSirets = userCompanies.map(c => c.siret);

  if (!formSirets.some(siret => userSirets.includes(siret))) {
    throw new ForbiddenError(
      "Vous ne pouvez pas créer ou modifier un bordereau sur lequel votre entreprise n'apparait pas."
    );
  }
}
