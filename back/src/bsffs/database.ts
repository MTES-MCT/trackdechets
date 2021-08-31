import type { SetRequired } from "type-fest";
import { Bsff, BsffFicheIntervention, BsffType, Prisma } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import prisma from "../prisma";
import { BsffInput } from "../generated/graphql/types";
import getReadableId, { ReadableIdPrefix } from "../forms/readableId";
import { flattenBsffInput, unflattenBsff } from "./converter";
import { isBsffContributor } from "./permissions";
import { validateBsff } from "./validation";
import { indexBsff } from "./elastic";

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

function getBsffType(input: BsffInput): BsffType {
  if (input.previousBsffs?.length > 0) {
    if (input.packagings?.length > 0) {
      return BsffType.RECONDITIONNEMENT;
    }

    if (input.previousBsffs?.length === 1) {
      return BsffType.REEXPEDITION;
    }

    return BsffType.GROUPEMENT;
  }

  if (input.ficheInterventions?.length === 1) {
    return BsffType.TRACER_FLUIDE;
  }

  return BsffType.COLLECTE_PETITES_QUANTITES;
}

export async function createBsff(
  user: Express.User,
  input: BsffInput,
  additionalData: Partial<Bsff> = {}
) {
  const flatInput = {
    id: getReadableId(ReadableIdPrefix.FF),
    type: getBsffType(input),

    ...flattenBsffInput(input),
    ...additionalData
  };

  await isBsffContributor(user, flatInput);

  const previousBsffs =
    input.previousBsffs?.length > 0
      ? await prisma.bsff.findMany({
          where: { id: { in: input.previousBsffs } }
        })
      : [];
  const ficheInterventions =
    input.ficheInterventions?.length > 0
      ? await prisma.bsffFicheIntervention.findMany({
          where: { id: { in: input.ficheInterventions } }
        })
      : [];

  await validateBsff(flatInput, previousBsffs, ficheInterventions);

  const data: Prisma.BsffCreateInput = flatInput;

  if (previousBsffs.length > 0) {
    data.previousBsffs = {
      connect: previousBsffs.map(({ id }) => ({ id }))
    };
  }

  if (ficheInterventions.length > 0) {
    data.ficheInterventions = {
      connect: ficheInterventions.map(({ id }) => ({ id }))
    };
  }

  const bsff = await prisma.bsff.create({ data });

  await indexBsff(bsff);

  return unflattenBsff(bsff);
}
