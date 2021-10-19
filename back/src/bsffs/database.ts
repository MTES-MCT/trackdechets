import type { SetRequired } from "type-fest";
import {
  Bsff,
  BsffFicheIntervention as PrismaBsffFicheIntervention,
  BsffType,
  Prisma
} from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import prisma from "../prisma";
import { BsffFicheIntervention, BsffInput } from "../generated/graphql/types";
import getReadableId, { ReadableIdPrefix } from "../forms/readableId";
import {
  flattenBsffInput,
  unflattenBsff,
  unflattenFicheInterventionBsff
} from "./converter";
import { isBsffContributor } from "./permissions";
import { validateBsff } from "./validation";
import { indexBsff } from "./elastic";
import { GraphQLContext } from "../types";

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
  const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
    where: {
      bsffId: bsff.id
    }
  });

  const unflattenedFicheInterventions = ficheInterventions.map(
    unflattenFicheInterventionBsff
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

function getBsffType(input: BsffInput): BsffType {
  if (input.grouping?.length > 0) {
    return BsffType.GROUPEMENT;
  }

  if (input.repackaging?.length > 0) {
    return BsffType.RECONDITIONNEMENT;
  }

  if (input.forwarding) {
    return BsffType.REEXPEDITION;
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

  const isForwarding = !!input.forwarding;
  const isRepackaging = input.repackaging?.length > 0;
  const isGrouping = input.grouping?.length > 0;

  if ([isForwarding, isRepackaging, isGrouping].filter(b => b).length > 1) {
    throw new UserInputError(
      "Les opérations d'entreposage provisoire, reconditionnement et groupement ne sont pas compatibles entre elles"
    );
  }

  // bordereau qui est réexpédié par celui-ci
  const forwardedBsff = isForwarding
    ? await getBsffOrNotFound({ id: input.forwarding })
    : null;

  // bordereaux qui sont reconditionnés dans celui-ci
  const repackagedBsffs = isRepackaging
    ? await prisma.bsff.findMany({ where: { id: { in: input.repackaging } } })
    : null;
  // bordereaux qui sont groupés dans celui-ci

  const groupedBsffs = isGrouping
    ? await prisma.bsff.findMany({ where: { id: { in: input.grouping } } })
    : null;

  const previousBsffs = [
    ...(isForwarding ? [forwardedBsff] : []),
    ...(isGrouping ? groupedBsffs : []),
    ...(isRepackaging ? repackagedBsffs : [])
  ];

  const ficheInterventions =
    input.ficheInterventions?.length > 0
      ? await prisma.bsffFicheIntervention.findMany({
          where: { id: { in: input.ficheInterventions } }
        })
      : [];

  await validateBsff(flatInput, previousBsffs, ficheInterventions);

  const data: Prisma.BsffCreateInput = flatInput;

  if (isForwarding) {
    data.forwarding = { connect: { id: input.forwarding } };
  }

  if (isGrouping) {
    data.grouping = {
      connect: input.grouping.map(id => ({
        id
      }))
    };
  }

  if (isRepackaging) {
    data.repackaging = {
      connect: input.repackaging.map(id => ({
        id
      }))
    };
  }

  if (ficheInterventions.length > 0) {
    data.ficheInterventions = {
      connect: ficheInterventions.map(({ id }) => ({ id }))
    };
  }

  const bsff = await prisma.bsff.create({ data });

  await indexBsff(bsff, { user } as GraphQLContext);

  return unflattenBsff(bsff);
}

/**
 * Returns direct parents of a BSFF
 */
export async function getPreviousBsffs(bsff: Bsff) {
  const forwardedBsff = bsff.forwardingId
    ? await prisma.bsff.findUnique({ where: { id: bsff.forwardingId } })
    : null;

  const repackagedBsffs = await prisma.bsff
    .findFirst({ where: { id: bsff.id } })
    .repackaging();

  const groupedBsffs = await prisma.bsff
    .findFirst({ where: { id: bsff.id } })
    .grouping();

  const previousBsffs = [
    ...(!!forwardedBsff ? [forwardedBsff] : []),
    ...groupedBsffs,
    ...repackagedBsffs
  ];
  return previousBsffs;
}

/**
 * Return all the BSFFs in the traceability history of this one
 */
export async function getBsffHistory(bsff: Bsff): Promise<Bsff[]> {
  async function inner(bsffs: Bsff[], history: Bsff[]) {
    const previous = await Promise.all(
      bsffs.map(bsff => getPreviousBsffs(bsff))
    );
    const previousFlattened = previous.reduce((ps, curr) => {
      return [...ps, ...curr];
    });
    if (previousFlattened.length === 0) {
      return history;
    }
    return inner(previousFlattened, [...previousFlattened, ...history]);
  }

  return inner([bsff], []);
}
