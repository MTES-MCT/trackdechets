import { BsdasriType } from "@prisma/client";

import {
  ResolversParentTypes,
  MutationUpdateBsdasriArgs
} from "../../../generated/graphql/types";

import { checkIsAuthenticated } from "../../../common/permissions";
import { ForbiddenError } from "apollo-server-express";

import { GraphQLContext } from "../../../types";
import { getBsdasriOrNotFound } from "../../database";
import {
  checkIsBsdasriContributor,
  checkCanEditBsdasri
} from "../../permissions";

import updateSynthesisBsdasri from "./updateSynthesisBsdasri";
import updateBsdasri from "./updateSimpleBsdasri";

/**
 * Bsdasri update mutation
 
 */
const updateBsdasriResolver = async (
  _: ResolversParentTypes["Mutation"],
  { id, input }: MutationUpdateBsdasriArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const {
    grouping: dbGrouping,
    synthesizing: dbSynthesizing,
    ...dbBsdasri
  } = await getBsdasriOrNotFound({
    id,
    includeAssociated: true
  });

  const formSirets = {
    emitterCompanySiret: dbBsdasri?.emitterCompanySiret,
    destinationCompanySiret: dbBsdasri?.destinationCompanySiret,
    transporterCompanySiret: dbBsdasri?.transporterCompanySiret,
    ecoOrganismeSiret: dbBsdasri?.ecoOrganismeSiret
  };

  await checkIsBsdasriContributor(
    user,
    formSirets,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparaît pas"
  );

  // forbid editing on some statuses
  if (["PROCESSED", "REFUSED"].includes(dbBsdasri.status)) {
    throw new ForbiddenError("Ce bordereau n'est plus modifiable");
  }

  // check this dasri is not associated to a synthesis bsdasri (grouped dasris are already PROCESSED thus no)
  checkCanEditBsdasri(dbBsdasri);

  if (dbBsdasri.type === BsdasriType.SYNTHESIS) {
    return updateSynthesisBsdasri({
      id,
      input,
      dbBsdasri,
      dbSynthesizing,
      user
    });
  }

  return updateBsdasri({ id, input, dbBsdasri, dbGrouping, user });
};

export default updateBsdasriResolver;
