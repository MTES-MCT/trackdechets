import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  flattenFicheInterventionBsffInput,
  getFicheInterventionId,
  unflattenFicheInterventionBsff
} from "../../converter";
import { getBsffOrNotFound } from "../../database";
import { isBsffContributor } from "../../permissions";

const updateFicheInterventionBsff: MutationResolvers["updateFicheInterventionBsff"] = async (
  _,
  { id, numero, input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const bsff = await getBsffOrNotFound(id);
  await isBsffContributor(user, bsff);

  const ficheInterventionId = getFicheInterventionId(id, numero);
  const existingFicheIntervention = await prisma.bsffFicheIntervention.findUnique(
    {
      where: {
        id: ficheInterventionId
      }
    }
  );
  if (existingFicheIntervention == null) {
    throw new UserInputError(
      `La fiche d'intervention n°${numero} n'existe pas pour le bordereau n°${bsff.id}.`
    );
  }

  const updatedFicheIntervention = await prisma.bsffFicheIntervention.update({
    data: flattenFicheInterventionBsffInput(input),
    where: { id: existingFicheIntervention.id }
  });

  return unflattenFicheInterventionBsff(updatedFicheIntervention);
};

export default updateFicheInterventionBsff;
