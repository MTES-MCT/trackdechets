import type { SetRequired } from "type-fest";
import {
  Bsff,
  BsffFicheIntervention as PrismaBsffFicheIntervention,
  BsffPackaging,
  BsffType,
  Prisma
} from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import prisma from "../prisma";
import {
  BsffFicheIntervention,
  BsffInput,
  BsffPackagingInput
} from "../generated/graphql/types";
import getReadableId, { ReadableIdPrefix } from "../forms/readableId";
import {
  flattenBsffInput,
  expandBsffFromDB,
  expandFicheInterventionBsffFromDB
} from "./converter";
import { isBsffContributor } from "./permissions";
import {
  validateBsff,
  validateFicheInterventions,
  validatePreviousPackagings
} from "./validation";
import { indexBsff } from "./elastic";
import { GraphQLContext } from "../types";

export async function getBsffOrNotFound(
  where: SetRequired<Prisma.BsffWhereInput, "id">
) {
  const bsff = await prisma.bsff.findFirst({
    where: { ...where, isDeleted: false },
    include: { packagings: true }
  });

  if (bsff == null) {
    throw new UserInputError(
      `Le bordereau de fluides frigorigènes n°${where.id} n'existe pas.`
    );
  }

  return bsff;
}

export async function getBsffPackagingOrNotFound(
  where: SetRequired<Prisma.BsffPackagingWhereInput, "id">
) {
  const bsffpackaging = await prisma.bsffPackaging.findFirst({
    where,
    include: { bsff: true }
  });

  if (bsffpackaging == null) {
    throw new UserInputError(
      `Le contenant de fluide dont l'identifiant Trackdéchets est ${where.id} n'existe pas.`
    );
  }

  return bsffpackaging;
}

export async function getFicheInterventionBsffOrNotFound(
  where: SetRequired<Prisma.BsffFicheInterventionWhereInput, "id">
): Promise<PrismaBsffFicheIntervention> {
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

/**
 * Return the "ficheInterventions" of a bsff, hiding some fields depending
 * on the user reading it
 * @param param0
 */
export async function getFicheInterventions({
  bsff,
  context
}: {
  bsff: Bsff;
  context: GraphQLContext;
}): Promise<BsffFicheIntervention[]> {
  const ficheInterventions = await prisma.bsff
    .findUnique({ where: { id: bsff.id } })
    .ficheInterventions();

  const unflattenedFicheInterventions = ficheInterventions.map(
    expandFicheInterventionBsffFromDB
  );

  // the user trying to read ficheInterventions might not be a contributor of the bsff
  // for example they could be reading the ficheInterventions of a bsff that was forwarded:
  // bsffs { forwarding { ficheInterventions } }
  // in this case, they are still allowed to read ficheInterventions but not all fields
  try {
    await isBsffContributor(context.user, bsff);
  } catch (err) {
    unflattenedFicheInterventions.forEach(ficheIntervention => {
      delete ficheIntervention.detenteur;
      delete ficheIntervention.operateur;
    });
  }

  return unflattenedFicheInterventions;
}

export async function createBsff(
  user: Express.User,
  input: BsffInput,
  additionalData: Partial<Bsff> = {}
) {
  const flatInput: Prisma.BsffCreateInput = {
    id: getReadableId(ReadableIdPrefix.FF),
    ...flattenBsffInput(input),
    ...additionalData
  };

  await isBsffContributor(user, flatInput);

  if (!input.type) {
    throw new UserInputError("Vous devez préciser le type de BSFF");
  }

  const ficheInterventions =
    input.ficheInterventions?.length > 0
      ? await prisma.bsffFicheIntervention.findMany({
          where: { id: { in: input.ficheInterventions } }
        })
      : [];

  const futureBsff = {
    ...flatInput,
    packagings: input.packagings
  };

  await validateBsff(futureBsff);
  await validateFicheInterventions(futureBsff, ficheInterventions);
  const { forwarding, grouping, repackaging } = input;

  const previousPackagings = await validatePreviousPackagings(futureBsff, {
    forwarding,
    grouping,
    repackaging
  });

  const packagings = getPackagingCreateInput(futureBsff, previousPackagings);

  const data: Prisma.BsffCreateInput = {
    ...flatInput,
    packagings: { create: packagings }
  };

  if (ficheInterventions.length > 0) {
    data.ficheInterventions = {
      connect: ficheInterventions.map(({ id }) => ({ id }))
    };
  }

  const bsff = await prisma.bsff.create({
    data
  });

  await indexBsff(bsff, { user } as GraphQLContext);

  return expandBsffFromDB(bsff);
}

export function getPackagingCreateInput(
  bsff: Partial<Bsff | Prisma.BsffCreateInput> & {
    packagings?: BsffPackagingInput[];
  },
  previousPackagings: BsffPackaging[]
): Prisma.BsffPackagingCreateWithoutBsffInput[] {
  return [BsffType.GROUPEMENT, BsffType.REEXPEDITION].includes(bsff.type as any)
    ? // auto complete packagings based on inital packages in case of groupement or réexpédition,
      // overwriting user provided data if necessary.
      previousPackagings.map(p => ({
        name: p.name,
        numero: p.numero,
        volume: p.volume,
        weight: p.acceptationWeight,
        previousPackagings: { connect: { id: p.id } }
      }))
    : bsff.type === BsffType.RECONDITIONNEMENT && bsff.packagings?.length > 0
    ? [
        {
          name: bsff.packagings[0].name,
          volume: bsff.packagings[0].volume,
          numero: bsff.packagings[0].numero,
          weight: bsff.packagings[0].weight,
          previousPackagings: {
            connect: previousPackagings.map(p => ({ id: p.id }))
          }
        }
      ]
    : bsff.packagings ?? [];
}

/**
 * Returns previous packagings in the traceability history of one or several packagings
 * `maxHops` allows to only go back in the history for a specific number of hops
 */
export async function getPreviousPackagings(
  packagingIds: string[],
  maxHops = Infinity
): Promise<BsffPackaging[]> {
  async function inner(
    packagingIds: string[],
    hops: number
  ): Promise<BsffPackaging[]> {
    if (hops >= maxHops) {
      return [];
    }

    const packagings = await prisma.bsffPackaging.findMany({
      where: { id: { in: packagingIds } },
      include: { previousPackagings: true }
    });

    const previousPackagings = packagings.flatMap(p => p.previousPackagings);

    if (previousPackagings.length === 0) {
      return [];
    }

    return [
      ...(await inner(
        previousPackagings.map(p => p.id),
        hops + 1
      )),
      ...previousPackagings
    ];
  }

  return inner(packagingIds, 0);
}

/**
 * Returns next packagings in the traceability history of one packaging
 * `maxHops` allow to move forward in the history for a specific number of hops
 */
export function getNextPackagings(
  packagingId: string,
  maxHops = Infinity
): Promise<BsffPackaging[]> {
  async function inner(
    packagingId: string,
    hops: number
  ): Promise<BsffPackaging[]> {
    if (hops >= maxHops) {
      return [];
    }

    const nextPackaging = await prisma.bsffPackaging
      .findUnique({
        where: { id: packagingId }
      })
      .nextPackaging();

    if (!nextPackaging) {
      return [];
    }

    return [nextPackaging, ...(await inner(nextPackaging.id, hops + 1))];
  }

  return inner(packagingId, 0);
}
