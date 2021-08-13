import { BsffType, Prisma } from "@prisma/client";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { flattenBsffInput, unflattenBsff } from "../../converter";
import { isBsffContributor } from "../../permissions";
import { isValidPreviousBsffs } from "../../validation";
import { indexBsff } from "../../elastic";

const createBsff: MutationResolvers["createBsff"] = async (
  _,
  { input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const flatInput: Prisma.BsffCreateInput = {
    id: getReadableId(ReadableIdPrefix.FF),
    type:
      input.previousBsffs?.length > 0
        ? input.packagings?.length > 0
          ? BsffType.RECONDITIONNEMENT
          : input.previousBsffs?.length === 1
          ? BsffType.REEXPEDITION
          : BsffType.GROUPEMENT
        : input.ficheInterventions?.length > 1
        ? BsffType.COLLECTE_PETITES_QUANTITES
        : BsffType.TRACER_FLUIDE,

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
    data
  });

  await indexBsff(bsff);

  return unflattenBsff(bsff);
};

export default createBsff;
