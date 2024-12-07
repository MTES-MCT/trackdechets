import { RegistryDelegation } from "@prisma/client";
import { RegistryDelegationResolvers } from "@td/codegen-back";
import { getDelegationStatus } from "../utils";

/**
 * For frontend's convenience, we compute the status here
 */
const getStatus = (delegation: RegistryDelegation) => {
  return getDelegationStatus(delegation);
};

export const statusResolver: RegistryDelegationResolvers["status"] =
  // Little cheat here on the typing, because we don't want to send the
  // revokedBy & cancelledBy to the front so they are excluded from the GQL type,
  // however we need them to compute the status. So we use the Prisma RegistryDelegation
  // here, and force the typing
  delegation => getStatus(delegation as unknown as RegistryDelegation);
