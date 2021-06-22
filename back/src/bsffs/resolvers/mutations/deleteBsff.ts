import { UserInputError } from "apollo-server-express";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { unflattenBsff } from "../../converter";
import { isBsffContributor } from "../../permissions";
import { getBsffOrNotFound } from "../../database";

const deleteBsff: MutationResolvers["deleteBsff"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound({ id });
  await isBsffContributor(user, existingBsff);

  if (existingBsff.emitterEmissionSignatureDate) {
    throw new UserInputError(
      `Il n'est pas possible de supprimer un bordereau qui a été signé par un des acteurs`
    );
  }

  const updatedBsff = await prisma.bsff.update({
    data: {
      isDeleted: true
    },
    where: {
      id
    }
  });

  return {
    ...unflattenBsff(updatedBsff),
    ficheInterventions: [],
    bsffs: []
  };
};

export default deleteBsff;
