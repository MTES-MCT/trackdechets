import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationPublishBsdaArgs } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { getBsdaRepository } from "../../repository";
import { checkCanUpdate } from "../../permissions";
import { ForbiddenError } from "../../../common/errors";
import { parseBsdaAsync } from "../../validation";
import { prismaToZodBsda } from "../../validation/helpers";

export default async function publish(
  _,
  { id }: MutationPublishBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const bsda = await getBsdaOrNotFound(id, {
    include: {
      intermediaries: true,
      grouping: true,
      transporters: true
    }
  });

  await checkCanUpdate(user, bsda);

  if (!bsda.isDraft) {
    throw new ForbiddenError(
      "Impossible de publier un bordereau qui n'est pas un brouillon"
    );
  }

  await parseBsdaAsync(
    { ...prismaToZodBsda(bsda), isDraft: false },
    {
      user,
      currentSignatureType: "EMISSION"
    }
  );

  const updatedBsda = await getBsdaRepository(user).update(
    { id },
    { isDraft: false }
  );

  return expandBsdaFromDb(updatedBsda);
}
