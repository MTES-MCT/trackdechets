import { RegistryDelegation } from "@prisma/client";
import { getRegistryDelegationRepository } from "../../../repository";

export const cancelDelegation = async (
  user: Express.User,
  delegation: RegistryDelegation
) => {
  const delegationRepository = getRegistryDelegationRepository(user);
  return delegationRepository.update(
    { id: delegation.id },
    { cancelledBy: user.id }
  );
};
