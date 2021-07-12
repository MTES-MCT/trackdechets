import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  flattenFicheInterventionBsffInput,
  unflattenFicheInterventionBsff
} from "../../converter";
import { isFicheInterventionOperateur } from "../../permissions";
import { ficheInterventionSchema } from "../../validation";

const createFicheInterventionBsff: MutationResolvers["createFicheInterventionBsff"] = async (
  _,
  { input },
  context
) => {
  const user = checkIsAuthenticated(context);

  const ficheInterventionData = flattenFicheInterventionBsffInput(input);
  await isFicheInterventionOperateur(user, ficheInterventionData);

  await ficheInterventionSchema.validate(ficheInterventionData, {
    abortEarly: false
  });

  const ficheIntervention = await prisma.bsffFicheIntervention.create({
    data: ficheInterventionData
  });

  return unflattenFicheInterventionBsff(ficheIntervention);
};

export default createFicheInterventionBsff;
