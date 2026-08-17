import type { MutationResolvers } from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandBsffPackagingFromDB } from "../../converter";
import {
  getBsffPackagingOrNotFound,
  getDetenteursCreateInput
} from "../../database";
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

  const { detenteurs, ficheInterventions, ...packagingScalars } =
    parsedBsffPackaging;

  await updateBsffPackaging({
    where: { id },
    data: {
      ...packagingScalars,
      ...(updatedFields.includes("detenteurs")
        ? {
            detenteurs: {
              deleteMany: {},
              ...getDetenteursCreateInput(detenteurs)
            }
          }
        : {}),
      ...(updatedFields.includes("ficheInterventions")
        ? {
            ficheInterventions: {
              set: [],
              connect: (ficheInterventions ?? []).map(id => ({ id }))
            }
          }
        : {})
    }
  });

  // Fetch the updated packaging with detenteurs relation
  const updatedBsffPackagingWithDetenteurs = await getBsffPackagingOrNotFound({
    id
  });

  return expandBsffPackagingFromDB(updatedBsffPackagingWithDetenteurs);
};

export default updateBsffPackaging;
