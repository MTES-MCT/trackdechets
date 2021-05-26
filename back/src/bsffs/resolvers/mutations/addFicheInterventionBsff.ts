import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  flattenFicheInterventionBsffInput,
  getFicheInterventionId,
  unflattenFicheInterventionBsff
} from "../../converter";
import { ficheInterventionSchema } from "../../validation";
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

  if (bsff.emitterEmissionSignatureDate) {
    throw new UserInputError(
      `Il n'est pas possible d'ajouter une fiche d'intervention après la signature de l'émetteur`
    );
  }

  const ficheInterventionId = getFicheInterventionId(id, numero);
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

  const ficheInterventionData = {
    ...flattenFicheInterventionBsffInput(input),
    id: ficheInterventionId,
    numero
  };

  await ficheInterventionSchema.validate(ficheInterventionData, {
    abortEarly: false
  });

  const ficheIntervention = await prisma.bsffFicheIntervention.create({
    data: {
      ...ficheInterventionData,
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
