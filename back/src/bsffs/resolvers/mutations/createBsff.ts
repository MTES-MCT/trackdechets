import { Bsff, BsffType, Prisma } from "@prisma/client";
import prisma from "../../../prisma";
import { BsffInput, MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { flattenBsffInput, unflattenBsff } from "../../converter";
import { isBsffContributor } from "../../permissions";
import { validateBsff } from "../../validation";
import { indexBsff } from "../../elastic";

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

  await isBsffContributor(user, flatInput);
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

const createBsffResolver: MutationResolvers["createBsff"] = async (
  _,
  { input },
  context
) => {
  const user = checkIsAuthenticated(context);
  return createBsff(user, input);
};

export default createBsffResolver;
