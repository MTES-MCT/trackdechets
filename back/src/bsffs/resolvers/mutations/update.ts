import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound } from "../../database";
import { flattenBsffInput, unflattenBsff } from "../../converter";
import { isBsffContributor } from "../../permissions";

const updateBsff: MutationResolvers["updateBsff"] = async (
  _,
  { id, input },
  context
) => {
  const user = checkIsAuthenticated(context);

  const existingBsff = await getBsffOrNotFound(id);
  await isBsffContributor(user, existingBsff);

  const flatInput = flattenBsffInput(input);
  console.log(flatInput);
  await isBsffContributor(user, { ...existingBsff, ...flatInput });

  const bsff = await prisma.bsff.update({
    data: flatInput,
    where: {
      id
    }
  });
  return {
    ...unflattenBsff(bsff),
    ficheInterventions: [],
    bsffs: []
  };
};

export default updateBsff;
