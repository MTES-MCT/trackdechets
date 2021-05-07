import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  flattenFicheInterventionBsffInput,
  generateFicheInterventionId,
  unflattenFicheInterventionBsff
} from "../../converter";
import { getBsffOrNotFound } from "../../database";
import { isBsffContributor } from "../../permissions";

const addFicheInterventionBsff: MutationResolvers["addFicheInterventionBsff"] = async (
  _,
  { id, numero, input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const bsff = await getBsffOrNotFound(id);
  await isBsffContributor(user, bsff);

  const ficheInterventionId = generateFicheInterventionId(id, numero);
  const existingFicheIntervention = await prisma.bsffFicheIntervention.findUnique(
    {
      where: {
        id: ficheInterventionId
      }
    }
  );
  if (existingFicheIntervention) {
    throw new UserInputError(
      `La fiche d'intervention n°${numero} est déjà lié au bordereau n°${bsff.id} et ne peut pas être créer à nouveau.`
    );
  }

  const ficheIntervention = await prisma.bsffFicheIntervention.create({
    data: {
      ...flattenFicheInterventionBsffInput(input),
      id: ficheInterventionId,
      numero,
      Bsff: {
        connect: {
          id: bsff.id
        }
      }
    }
  });

  return unflattenFicheInterventionBsff(ficheIntervention);
};

export default addFicheInterventionBsff;
