import { UserInputError } from "apollo-server-express";
import { MutationResolvers } from "../../../generated/graphql/types";
import * as elastic from "../../../common/elastic";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandBsffFromDB } from "../../converter";
import { checkCanWriteBsff } from "../../permissions";
import { getBsffOrNotFound } from "../../database";
import { runInTransaction } from "../../../common/repository/helper";

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

  const updatedBsff = await runInTransaction(async transaction => {
    // disconnect previous packagings
    await transaction.bsffPackaging.updateMany({
      where: {
        nextPackagingId: { in: existingBsff.packagings.map(p => p.id) }
      },
      data: { nextPackagingId: null }
    });

    return transaction.bsff.update({
      where: {
        id
      },
      data: {
        isDeleted: true
      }
    });
  });

  await elastic.deleteBsd(updatedBsff, context);

  return expandBsffFromDB(updatedBsff);
};

export default deleteBsff;
