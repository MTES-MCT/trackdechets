import { GraphQLContext } from "../../types";
import { flattenObjectForDb, unflattenObjectFromDb } from "../form-converter";
import { DomainError, ErrorCode } from "../../common/errors";
import { getReadableId } from "../readable-id";
import {
  Form,
  FormUpdateInput,
  FormCreateInput
} from "../../generated/prisma-client";
import { getUserCompanies } from "../../companies/queries";

export async function saveForm(_, { formInput }, context: GraphQLContext) {
  const userId = context.user.id;

  const { id, ...formContent } = formInput;
  const form = flattenObjectForDb(formContent);

  await checkThatUserIsPartOftheForm(userId, { ...form, id }, context);

  if (id) {
    const updatedForm = await context.prisma.updateForm({
      where: { id },
      data: {
        ...(form as FormUpdateInput),
        appendix2Forms: { set: formContent.appendix2Forms }
      }
    });

    return unflattenObjectFromDb(updatedForm);
  }

  const newForm = await context.prisma.createForm({
    ...(form as FormCreateInput),
    appendix2Forms: { connect: formContent.appendix2Forms },
    readableId: await getReadableId(context),
    owner: { connect: { id: userId } }
  });

  return unflattenObjectFromDb(newForm);
}

const formSiretsGetter = (form: Partial<Form>) => [
  form.emitterCompanySiret,
  form.traderCompanySiret,
  form.recipientCompanySiret,
  form.transporterCompanySiret
];

async function checkThatUserIsPartOftheForm(
  userId: string,
  form: Partial<Form>,
  context: GraphQLContext
) {
  const isEdition = form.id != null;
  const formSirets = formSiretsGetter(form);
  const hasPartialFormInput = formSirets.some(siret => siret == null);

  if (isEdition && hasPartialFormInput) {
    const savedForm = await context.prisma.form({ id: form.id });
    const savedFormSirets = formSiretsGetter(savedForm);
    formSirets.push(...savedFormSirets);
  }

  const userCompanies = await getUserCompanies(userId);
  const userSirets = userCompanies.map(c => c.siret);

  if (!formSirets.some(siret => userSirets.includes(siret))) {
    throw new DomainError(
      "Vous ne pouvez pas créer ou modifier un bordereau sur lequel votre entreprise n'apparait pas.",
      ErrorCode.BAD_USER_INPUT
    );
  }
}
