import {
  RndtsDeclarationDelegation,
  RndtsDeclarationDelegationResolvers,
  RndtsDeclarationDelegationStatus
} from "../../../generated/graphql/types";

/**
 * For frontend's convenience, we compute the status here
 */
const getStatus = (delegation: RndtsDeclarationDelegation) => {
  const NOW = new Date();

  const { isRevoked, startDate, endDate } = delegation;

  if (isRevoked) return "CLOSED" as RndtsDeclarationDelegationStatus;

  if (startDate > NOW) return "INCOMING" as RndtsDeclarationDelegationStatus;

  if (startDate <= NOW && (!endDate || endDate > NOW))
    return "ONGOING" as RndtsDeclarationDelegationStatus;

  return "CLOSED" as RndtsDeclarationDelegationStatus;
};

export const statusResolver: RndtsDeclarationDelegationResolvers["status"] =
  delegation => getStatus(delegation);
