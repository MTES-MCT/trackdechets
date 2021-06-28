import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  flattenFicheInterventionBsffInput,
  unflattenFicheInterventionBsff
} from "../../converter";
import { ficheInterventionSchema } from "../../validation";
import { getFicheInterventionBsffOrNotFound } from "../../database";

const updateFicheInterventionBsff: MutationResolvers["updateFicheInterventionBsff"] = async (
  _,
  { id, input },
  context
) => {
  checkIsAuthenticated(context);

  const existingFicheIntervention = await getFicheInterventionBsffOrNotFound({
    id
  });
  const ficheInterventionData = flattenFicheInterventionBsffInput(input);

  await ficheInterventionSchema.validate({
    ...existingFicheIntervention,
    ...ficheInterventionData
  });

  const updatedFicheIntervention = await prisma.bsffFicheIntervention.update({
    data: ficheInterventionData,
    where: { id: existingFicheIntervention.id }
  });

  return unflattenFicheInterventionBsff(updatedFicheIntervention);
};

export default updateFicheInterventionBsff;
