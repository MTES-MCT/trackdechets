import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  flattenFicheInterventionBsffInput,
  unflattenFicheInterventionBsff
} from "../../converter";
import { isFicheInterventionOperateur } from "../../permissions";
import { validateFicheIntervention } from "../../validation";

const createFicheInterventionBsff: MutationResolvers["createFicheInterventionBsff"] = async (
  _,
  { input },
  context
) => {
  const user = checkIsAuthenticated(context);

  const flatInput = flattenFicheInterventionBsffInput(input);
  await isFicheInterventionOperateur(user, flatInput);

  await validateFicheIntervention(flatInput);

  const ficheIntervention = await prisma.bsffFicheIntervention.create({
    data: flatInput
  });

  return unflattenFicheInterventionBsff(ficheIntervention);
};

export default createFicheInterventionBsff;
