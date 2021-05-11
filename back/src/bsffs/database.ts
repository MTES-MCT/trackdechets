import { Bsff, BsffFicheIntervention } from ".prisma/client";
import { UserInputError } from "apollo-server-express";
import prisma from "../prisma";
import { getFicheInterventionId } from "./converter";

export async function getBsffOrNotFound(id: string): Promise<Bsff> {
  const bsff = await prisma.bsff.findFirst({
    where: { id, isDeleted: false }
  });

  if (bsff == null) {
    throw new UserInputError(
      `Le bordereau de fluides frigorigènes n°${id} n'existe pas.`
    );
  }

  return bsff;
}

export async function getFicheInterventionBsffOrNotFound(
  bsffId: string,
  ficheInterventionNumero: string
): Promise<BsffFicheIntervention> {
  const ficheInterventionId = getFicheInterventionId(
    bsffId,
    ficheInterventionNumero
  );
  const ficheIntervention = await prisma.bsffFicheIntervention.findUnique({
    where: {
      id: ficheInterventionId
    }
  });
  if (ficheIntervention == null) {
    throw new UserInputError(
      `La fiche d'intervention n°${ficheInterventionNumero} n'existe pas pour le bordereau n°${bsffId}.`
    );
  }
  return ficheIntervention;
}
