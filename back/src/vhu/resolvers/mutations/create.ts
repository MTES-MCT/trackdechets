import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { MutationCreateBsvhuArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb, flattenVhuInput } from "../../converter";
import { checkIsFormContributor } from "../../permissions";
import { validateVhuForm } from "../../validation";

export default async function create(
  _,
  { input }: MutationCreateBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const form = flattenVhuInput(input);
  await checkIsFormContributor(
    user,
    form,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
  );

  await validateVhuForm(form, {});

  const newForm = await prisma.vhuForm.create({
    data: { ...form, readableId: getReadableId(ReadableIdPrefix.VHU) }
  });

  // TODO Status log ?
  // TODO emit event ?

  return expandVhuFormFromDb(newForm);
}
