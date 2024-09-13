import { UserInputError } from "../../../common/errors";
import { getRndtsDeclarationDelegationRepository } from "../../repository";
import { ParsedCreateRndtsDeclarationDelegationInput } from "../../validation";

export const createDelegation = async (
  user: Express.User,
  input: ParsedCreateRndtsDeclarationDelegationInput
) => {
  const delegationRepository = getRndtsDeclarationDelegationRepository(user);
  return delegationRepository.create(input);
};

/**
 * Check to prevent having multiple active delegations at the same time.
 *
 * We don't authorize already having a non-revoked delegation (isRevoked=false) that has
 * not yet expired.
 *
 * That means that if the company has a delegation that only takes effect in the future,
 * it cannot create a new one for the meantime. Users would have to delete the delegation
 * in the future and create a new one.
 */
export const checkNoExistingNotRevokedAndNotExpiredDelegation = async (
  user: Express.User,
  input: ParsedCreateRndtsDeclarationDelegationInput
) => {
  const NOW = new Date();

  const delegationRepository = getRndtsDeclarationDelegationRepository(user);
  const activeDelegation = await delegationRepository.findFirst({
    delegatorOrgId: input.delegatorOrgId,
    delegateOrgId: input.delegateOrgId,
    isRevoked: false,
    OR: [{ endDate: null }, { endDate: { gt: NOW } }]
  });

  if (activeDelegation) {
    throw new UserInputError(
      `Une délégation existe déjà pour ce délégataire et ce délégant (id ${activeDelegation.id})`
    );
  }
};
