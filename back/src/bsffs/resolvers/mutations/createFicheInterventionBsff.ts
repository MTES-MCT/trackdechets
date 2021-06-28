import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  flattenFicheInterventionBsffInput,
  unflattenFicheInterventionBsff
} from "../../converter";
import { ficheInterventionSchema } from "../../validation";

const createFicheInterventionBsff: MutationResolvers["createFicheInterventionBsff"] = async (
  _,
  { input },
  context
) => {
  checkIsAuthenticated(context);

  const ficheInterventionData = flattenFicheInterventionBsffInput(input);

  await ficheInterventionSchema.validate(ficheInterventionData, {
    abortEarly: false
  });

  const ficheIntervention = await prisma.bsffFicheIntervention.create({
    data: ficheInterventionData
  });

  return unflattenFicheInterventionBsff(ficheIntervention);
};

export default createFicheInterventionBsff;
