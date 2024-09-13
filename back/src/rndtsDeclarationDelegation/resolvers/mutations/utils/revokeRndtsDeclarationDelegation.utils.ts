import { RndtsDeclarationDelegation } from "@prisma/client";
import { getRndtsDeclarationDelegationRepository } from "../../../repository";

export const revokeDelegation = async (
  user: Express.User,
  delegation: RndtsDeclarationDelegation
) => {
  const delegationRepository = getRndtsDeclarationDelegationRepository(user);
  return delegationRepository.update(
    { id: delegation.id },
    { isRevoked: true }
  );
};
