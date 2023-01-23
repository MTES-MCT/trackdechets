import { UserInputError } from "apollo-server-express";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandBsffFromDB } from "../../converter";
import { checkCanWriteBsff } from "../../permissions";
import { getBsffOrNotFound } from "../../database";
import { getBsffRepository } from "../../repository";

const deleteBsff: MutationResolvers["deleteBsff"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound({ id });
  await checkCanWriteBsff(user, existingBsff);

  if (existingBsff.emitterEmissionSignatureDate) {
    throw new UserInputError(
      `Il n'est pas possible de supprimer un bordereau qui a été signé par un des acteurs`
    );
  }

  const { delete: deleteBsff } = getBsffRepository(user);

  const deletedBsff = await deleteBsff({ where: { id } });

  return expandBsffFromDB(deletedBsff);
};

export default deleteBsff;
