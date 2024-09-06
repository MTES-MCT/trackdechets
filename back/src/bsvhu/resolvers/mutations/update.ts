import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsvhuArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import {
  companyToIntermediaryInput,
  expandVhuFormFromDb
} from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { mergeInputAndParseBsvhuAsync } from "../../validation";
import { getBsvhuRepository } from "../../repository";
import { checkCanUpdate } from "../../permissions";
import { BsvhuForParsingInclude } from "../../validation/types";

export default async function edit(
  _,
  { id, input }: MutationUpdateBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const existingBsvhu = await getBsvhuOrNotFound(id, {
    include: BsvhuForParsingInclude
  });

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

  const intermediaries = parsedBsvhu.intermediaries
    ? {
        deleteMany: {},
        ...(parsedBsvhu.intermediaries.length > 0 && {
          create: companyToIntermediaryInput(parsedBsvhu.intermediaries)
        })
      }
    : undefined;

  const { update } = getBsvhuRepository(user);
  const { createdAt, ...bsvhu } = parsedBsvhu;

  const updatedBsvhu = await update(
    { id },
    {
      ...bsvhu,
      intermediaries
    }
  );

  return expandVhuFormFromDb(updatedBsvhu);
}
