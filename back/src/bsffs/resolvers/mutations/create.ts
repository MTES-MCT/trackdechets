import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { flattenBsffInput, unflattenBsff } from "../../converter";
import { isBsffContributor } from "../../permissions";

const createBsff: MutationResolvers["createBsff"] = async (
  _,
  { input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const flatInput = flattenBsffInput(input);

  await isBsffContributor(user, flatInput);

  const bsff = await prisma.bsff.create({
    data: {
      id: getReadableId(ReadableIdPrefix.FF),
      ...flatInput
    }
  });
  return {
    ...unflattenBsff(bsff),
    ficheInterventions: [],
    bsffs: []
  };
};

export default createBsff;
