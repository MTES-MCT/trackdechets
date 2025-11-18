import { BsdasriType } from "@td/prisma";

import type {
  ResolversParentTypes,
  MutationUpdateBsdasriArgs
} from "@td/codegen-back";

import { checkIsAuthenticated } from "../../../common/permissions";

import { GraphQLContext } from "../../../types";
import { getFullBsdasriOrNotFound } from "../../database";

import updateSynthesisBsdasri from "./updateSynthesisBsdasri";
import updateBsdasri from "./updateSimpleBsdasri";
import { checkCanUpdate } from "../../permissions";
import { ForbiddenError } from "../../../common/errors";

/**
 * Bsdasri update mutation

 */
const updateBsdasriResolver = async (
  _: ResolversParentTypes["Mutation"],
  { id, input }: MutationUpdateBsdasriArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const existingBsdasri = await getFullBsdasriOrNotFound(id, {
    include: {
      grouping: true,
      synthesizing: true,
      intermediaries: true
    }
  });

  const {
    grouping: dbGrouping,
    synthesizing: dbSynthesizing,
    ...dbBsdasri
  } = existingBsdasri;

  await checkCanUpdate(user, existingBsdasri, input);

  // forbid editing on some statuses
  if (["PROCESSED", "REFUSED"].includes(dbBsdasri.status)) {
    throw new ForbiddenError("Ce bordereau n'est plus modifiable");
  }

  if (dbBsdasri.type === BsdasriType.SYNTHESIS) {
    return updateSynthesisBsdasri({
      id,
      input,
      dbBsdasri: existingBsdasri,
      dbSynthesizing,
      user
    });
  }

  return updateBsdasri({
    id,
    input,
    dbBsdasri: existingBsdasri,
    dbGrouping,
    user
  });
};

export default updateBsdasriResolver;
