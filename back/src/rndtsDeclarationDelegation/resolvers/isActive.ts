import {
  RndtsDeclarationDelegation,
  RndtsDeclarationDelegationResolvers
} from "../../generated/graphql/types";

/**
 * For frontend's convenience, we compute isActive here
 */
const getIsActive = (delegation: RndtsDeclarationDelegation) => {
  const NOW = new Date();

  const isStartDateValid = delegation.validityStartDate <= NOW;
  const isEndDateValid =
    !delegation.validityEndDate || delegation.validityEndDate > NOW;

  return delegation.isAccepted && isStartDateValid && isEndDateValid;
};

export const isActiveResolver: RndtsDeclarationDelegationResolvers["isActive"] =
  delegation => getIsActive(delegation);
