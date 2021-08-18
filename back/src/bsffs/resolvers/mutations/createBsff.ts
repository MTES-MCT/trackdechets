import { Prisma } from "@prisma/client";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { flattenBsffInput, unflattenBsff } from "../../converter";
import { isBsffContributor } from "../../permissions";
import { canAddPreviousBsffs } from "../../validation";
import { indexBsff } from "../../elastic";

const createBsff: MutationResolvers["createBsff"] = async (
  _,
  { input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const flatInput: Prisma.BsffCreateInput = {
    ...flattenBsffInput(input),
    id: getReadableId(ReadableIdPrefix.FF)
  };

  await isBsffContributor(user, flatInput);

  if (input.previousBsffs?.length > 0) {
    await canAddPreviousBsffs(input.previousBsffs);
    flatInput.previousBsffs = {
      connect: input.previousBsffs.map(id => ({ id }))
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
