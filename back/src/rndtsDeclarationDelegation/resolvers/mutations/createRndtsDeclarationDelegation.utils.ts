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
 * Check for overlaps in delegations.
 *
 * We don't authorize already having an accepted delegation (isAccepted=true) that has
 * not yet expired.
 *
 * That means that if the company has a delegation that only takes effect in the future,
 * it cannot create a new one for the meantime. Users would have to delete the delegation
 * in the future and create a new one.
 */
export const checkNoOverlappingDelegation = async (
  user: Express.User,
  input: ParsedCreateRndtsDeclarationDelegationInput
) => {
  // TODO: fix
  const delegationRepository = getRndtsDeclarationDelegationRepository(user);
  const activeDelegation = await delegationRepository.findActive(input);

  if (activeDelegation) {
    throw new UserInputError(
      `Une délégation est déjà active pour ce délégataire et ce délégant (id ${activeDelegation.id})`
    );
  }
};
