import {
  RegistryDelegation,
  RegistryDelegationResolvers,
  RegistryDelegationStatus
} from "../../../generated/graphql/types";

/**
 * For frontend's convenience, we compute the status here
 */
const getStatus = (delegation: RegistryDelegation) => {
  const NOW = new Date();

  const { isRevoked, startDate, endDate } = delegation;

  if (isRevoked) return "CLOSED" as RegistryDelegationStatus;

  if (startDate > NOW) return "INCOMING" as RegistryDelegationStatus;

  if (startDate <= NOW && (!endDate || endDate > NOW))
    return "ONGOING" as RegistryDelegationStatus;

  return "CLOSED" as RegistryDelegationStatus;
};

export const statusResolver: RegistryDelegationResolvers["status"] =
  delegation => getStatus(delegation);
