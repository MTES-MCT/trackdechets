import { Prisma } from ".prisma/client";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { flattenBsffInput, unflattenBsff } from "../../converter";
import { isBsffContributor } from "../../permissions";
import { canAssociateBsffs } from "../../validation";
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

  if (input.children?.length > 0) {
    await canAssociateBsffs(input.children);
    flatInput.children = {
      connect: input.children.map(id => ({ id }))
    };
  }

  const data: Prisma.BsffCreateInput = flatInput;
  const bsff = await prisma.bsff.create({
    data
  });

  await indexBsff(bsff);

  return {
    ...unflattenBsff(bsff),
    ficheInterventions: [],
    children: []
  };
};

export default createBsff;
