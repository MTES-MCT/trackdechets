import {
  RegistryDelegation,
  RegistryDelegationResolvers
} from "../../../generated/graphql/types";
import { getDelegationStatus } from "../utils";

/**
 * For frontend's convenience, we compute the status here
 */
const getStatus = (delegation: RegistryDelegation) =>
  getDelegationStatus(delegation);

export const statusResolver: RegistryDelegationResolvers["status"] =
  delegation => getStatus(delegation);
