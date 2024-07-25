import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsvhuArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { mergeInputAndParseBsvhuAsync } from "../../validation";
import { getBsvhuRepository } from "../../repository";
import { checkCanUpdate } from "../../permissions";
import { Prisma } from "@prisma/client";

export default async function edit(
  _,
  { id, input }: MutationUpdateBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const existingBsvhu = await getBsvhuOrNotFound(id);

  await checkCanUpdate(user, existingBsvhu, input);

  const { parsedBsvhu, updatedFields } = await mergeInputAndParseBsvhuAsync(
    existingBsvhu,
    input,
    { user }
  );
  if (updatedFields.length === 0) {
    // Évite de faire un update "à blanc" si l'input
    // ne modifie pas les données. Cela permet de limiter
    // le nombre d'évenements crées dans Mongo.
    return expandVhuFormFromDb(existingBsvhu);
  }

  const { update } = getBsvhuRepository(user);
  const { createdAt, ...bsvhu } = parsedBsvhu;

  const data: Prisma.BsvhuUpdateInput = { ...bsvhu };

  const updatedBsvhu = await update({ id }, data);

  return expandVhuFormFromDb(updatedBsvhu);
}
