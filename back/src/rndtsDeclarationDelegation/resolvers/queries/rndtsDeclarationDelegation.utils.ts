import { UserInputError } from "../../../common/errors";
import { getRndtsDeclarationDelegationRepository } from "../../repository";

export const findDelegationByIdOrThrow = async (
  user: Express.User,
  id: string
) => {
  const delegationRepository = getRndtsDeclarationDelegationRepository(user);
  const delegation = await delegationRepository.findFirst({ id });

  if (!delegation) {
    throw new UserInputError(`La demande de délégation ${id} n'existe pas`);
  }

  return delegation;
};
