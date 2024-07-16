import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound } from "../../database";
import { checkCanUpdate } from "../../permissions";
import { expandBsffFromDB } from "../../converter";
import { getBsffRepository } from "../../repository";
import { BsffWithTransportersInclude } from "../../types";
import { parseBsffAsync } from "../../validation/bsff";
import { prismaToZodBsff } from "../../validation/bsff/helpers";

const publishBsffResolver: MutationResolvers["publishBsff"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound({ id });

  const { updateBsff } = getBsffRepository(user);

  await checkCanUpdate(user, existingBsff);

  const zodBsff = prismaToZodBsff(existingBsff);
  await parseBsffAsync(
    { ...zodBsff, isDraft: false },
    { currentSignatureType: "EMISSION" }
  );

  const updatedBsff = await updateBsff({
    where: {
      id: existingBsff.id
    },
    include: BsffWithTransportersInclude,
    data: {
      isDraft: false
    }
  });

  return expandBsffFromDB(updatedBsff);
};

export default publishBsffResolver;
