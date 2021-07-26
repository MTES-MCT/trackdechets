import type { SetRequired } from "type-fest";
import { Bsff, BsffFicheIntervention, Prisma } from ".prisma/client";
import { UserInputError } from "apollo-server-express";
import prisma from "../prisma";

export async function getNextBsffs(
  bsff: Bsff,
  nextBsffs: Bsff[] = []
): Promise<Bsff[]> {
  if (bsff.nextBsffId) {
    const nextBsff = await prisma.bsff.findUnique({
      where: { id: bsff.nextBsffId }
    });
    return getNextBsffs(nextBsff, nextBsffs.concat([nextBsff]));
  }
  return nextBsffs;
}

export async function getBsffOrNotFound(
  where: SetRequired<Prisma.BsffWhereInput, "id">
): Promise<Bsff> {
  const bsff = await prisma.bsff.findFirst({
    where: { ...where, isDeleted: false }
  });

  if (bsff == null) {
    throw new UserInputError(
      `Le bordereau de fluides frigorigènes n°${where.id} n'existe pas.`
    );
  }

  return bsff;
}

export async function getFicheInterventionBsffOrNotFound(
  where: SetRequired<Prisma.BsffFicheInterventionWhereInput, "id">
): Promise<BsffFicheIntervention> {
  const ficheIntervention = await prisma.bsffFicheIntervention.findFirst({
    where
  });
  if (ficheIntervention == null) {
    throw new UserInputError(
      `La fiche d'intervention n°${where.id} n'existe pas.`
    );
  }
  return ficheIntervention;
}
