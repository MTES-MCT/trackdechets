import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationPublishBsvhuArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { parseBsvhuAsync } from "../../validation";
import { getBsvhuRepository } from "../../repository";
import { checkCanUpdate } from "../../permissions";
import { ForbiddenError } from "../../../common/errors";
import { prismaToZodBsvhu } from "../../validation/helpers";
import { BsvhuForParsingInclude } from "../../validation/types";

export default async function publish(
  _,
  { id }: MutationPublishBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const existingBsvhu = await getBsvhuOrNotFound(id, {
    include: BsvhuForParsingInclude
  });

  await checkCanUpdate(user, existingBsvhu);

  if (!existingBsvhu.isDraft) {
    throw new ForbiddenError(
      "Impossible de publier un bordereau qui n'est pas un brouillon"
    );
  }

  await parseBsvhuAsync(
    { ...prismaToZodBsvhu(existingBsvhu), isDraft: false },
    {
      user,
      currentSignatureType: "EMISSION"
    }
  );

  const updatedBsvhu = await getBsvhuRepository(user).update(
    { id },
    { isDraft: false }
  );

  return expandVhuFormFromDb(updatedBsvhu);
}
