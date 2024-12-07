import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "@td/codegen-back";
import { getBspaohOrNotFound } from "../../database";
import { expandBspaohFromDb } from "../../converter";
import { parseBspaohInContext } from "../../validation";

import { checkCanUpdate } from "../../permissions";
import { BspaohStatus } from "@prisma/client";
import { ForbiddenError } from "../../../common/errors";

import { prepareBspaohForParsing } from "./utils";
import { getBspaohRepository } from "../../repository";

const publishBspaohResolver: MutationResolvers["publishBspaoh"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const existingBspaoh = await getBspaohOrNotFound({
    id
  });
  await checkCanUpdate(user, existingBspaoh);

  if (existingBspaoh.status !== BspaohStatus.DRAFT) {
    throw new ForbiddenError(
      "Impossible de publier un bordereau qui n'est pas un brouillon."
    );
  }

  const { preparedExistingBspaoh } = prepareBspaohForParsing(existingBspaoh);
  await parseBspaohInContext(
    { persisted: preparedExistingBspaoh },
    { currentSignatureType: "EMISSION" }
  );

  const bspaohRepository = getBspaohRepository(user);
  // publish bspaoh
  const publishedBspaoh = await bspaohRepository.update(
    { id: existingBspaoh.id },
    { status: BspaohStatus.INITIAL }
  );

  return expandBspaohFromDb(publishedBspaoh);
};

export default publishBspaohResolver;
