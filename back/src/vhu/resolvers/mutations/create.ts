import { checkIsAuthenticated } from "src/common/permissions";
import { MutationCreateVhuFormArgs } from "src/generated/graphql/types";
import prisma from "src/prisma";
import { GraphQLContext } from "src/types";
import { expandVhuFormFromDb, flattenVhuInput } from "src/vhu/converter";
import { checkIsFormContributor } from "src/vhu/permissions";
import { validateVhuForm } from "src/vhu/validation";

export default async function createVhuForm(
  _,
  { vhuFormInput }: MutationCreateVhuFormArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const form = flattenVhuInput(vhuFormInput);
  await checkIsFormContributor(
    user,
    form,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
  );

  await validateVhuForm(form, {});

  const newForm = await prisma.vhuForm.create({
    data: { ...form, owner: { connect: { id: user.id } } }
  });

  // TODO Status log ?
  // TODO emit event ?

  return expandVhuFormFromDb(newForm);
}
