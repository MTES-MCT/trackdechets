import { RegistryDelegation } from "@prisma/client";
import { getRegistryDelegationRepository } from "../../../repository";

export const revokeDelegation = async (
  user: Express.User,
  delegation: RegistryDelegation
) => {
  const delegationRepository = getRegistryDelegationRepository(user);
  return delegationRepository.update(
    { id: delegation.id },
    { isRevoked: true }
  );
};
