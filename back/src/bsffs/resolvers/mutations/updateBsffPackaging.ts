import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  flattenBsffPackagingInput,
  expandBsffPackagingFromDB
} from "../../converter";
import { getBsffPackagingOrNotFound } from "../../database";
import { getBsffPackagingRepository } from "../../repository";
import { checkEditionRules } from "../../edition/bsffPackagingEdition";
import { sirenifyBsffPackagingInput } from "../../sirenify";
import { checkCanUpdateBsffPackaging } from "../../permissions";
import { UserInputError } from "../../../common/errors";

const updateBsffPackaging: MutationResolvers["updateBsffPackaging"] = async (
  _,
  { id, input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsffPackaging = await getBsffPackagingOrNotFound({ id });

  await checkCanUpdateBsffPackaging(user, existingBsffPackaging.bsff);

  if (input.numero === null || input.numero === "") {
    throw new UserInputError(
      "Le numéro de contenant ne peut pas être nul ou vide"
    );
  }

  const sirenifiedInput = await sirenifyBsffPackagingInput(input, user);
  const flatInput = flattenBsffPackagingInput(sirenifiedInput);

  await checkEditionRules(existingBsffPackaging, input);

  const { update: updateBsffPackaging } = getBsffPackagingRepository(user);

  const updatedBsffPackaging = await updateBsffPackaging({
    where: { id },
    data: flatInput
  });

  return expandBsffPackagingFromDB(updatedBsffPackaging);
};

export default updateBsffPackaging;
