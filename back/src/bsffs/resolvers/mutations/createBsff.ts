import { BsffType, Prisma } from "@prisma/client";
import prisma from "../../../prisma";
import { BsffInput, MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { flattenBsffInput, unflattenBsff } from "../../converter";
import { isBsffContributor } from "../../permissions";
import { isValidPreviousBsffs } from "../../validation";
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
  additionalData: Partial<Prisma.BsffCreateInput> = {}
) {
  const flatInput: Prisma.BsffCreateInput = {
    id: getReadableId(ReadableIdPrefix.FF),
    type: getBsffType(input),

    ...flattenBsffInput(input)
  };

  await isBsffContributor(user, flatInput);

  if (input.previousBsffs?.length > 0) {
    await isValidPreviousBsffs(flatInput.type, input.previousBsffs);
    flatInput.previousBsffs = {
      connect: input.previousBsffs.map(id => ({ id }))
    };
  }

  if (input.ficheInterventions?.length > 0) {
    flatInput.ficheInterventions = {
      connect: input.ficheInterventions.map(id => ({ id }))
    };
  }

  const data: Prisma.BsffCreateInput = flatInput;
  const bsff = await prisma.bsff.create({
    data: {
      ...data,
      ...additionalData
    }
  });

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
