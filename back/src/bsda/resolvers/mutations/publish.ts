import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationPublishBsdaArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb } from "../../converter";
import { getBsdaOrNotFound } from "../../database";
import { getBsdaRepository } from "../../repository";
import { checkCanUpdate } from "../../permissions";
import { parseBsdaInContext } from "../../validation";
import { ForbiddenError } from "../../../common/errors";

export default async function publish(
  _,
  { id }: MutationPublishBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const bsda = await getBsdaOrNotFound(id, {
    include: { intermediaries: true, grouping: true, forwarding: true }
  });

  await checkCanUpdate(user, bsda);

  if (!bsda.isDraft) {
    throw new ForbiddenError(
      "Impossible de publier un bordereau qui n'est pas un brouillon"
    );
  }

  await parseBsdaInContext(
    { persisted: bsda },
    { currentSignatureType: "EMISSION" }
  );

  const updatedBsda = await getBsdaRepository(user).update(
    { id },
    { isDraft: false }
  );

  return expandBsdaFromDb(updatedBsda);
}
