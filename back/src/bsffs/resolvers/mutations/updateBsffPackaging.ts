import type { MutationResolvers } from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandBsffPackagingFromDB } from "../../converter";
import { getBsffPackagingOrNotFound } from "../../database";
import { getBsffPackagingRepository } from "../../repository";
import { checkCanUpdateBsffPackaging } from "../../permissions";
import { mergeInputAndParseBsffPackagingAsync } from "../../validation/bsffPackaging";

const updateBsffPackaging: MutationResolvers["updateBsffPackaging"] = async (
  _,
  { id, input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsffPackaging = await getBsffPackagingOrNotFound({ id });

  await checkCanUpdateBsffPackaging(user, existingBsffPackaging.bsff);

  const { parsedBsffPackaging, updatedFields } =
    await mergeInputAndParseBsffPackagingAsync(
      existingBsffPackaging,
      input,
      {}
    );

  if (updatedFields.length === 0) {
    // Évite de faire un update "à blanc" si l'input
    // ne modifie pas les données. Cela permet de limiter
    // le nombre d'évenements crées dans Mongo.
    return expandBsffPackagingFromDB(existingBsffPackaging);
  }

  const { update: updateBsffPackaging } = getBsffPackagingRepository(user);

  const updatedBsffPackaging = await updateBsffPackaging({
    where: { id },
    data: parsedBsffPackaging
  });

  return expandBsffPackagingFromDB(updatedBsffPackaging);
};

export default updateBsffPackaging;
