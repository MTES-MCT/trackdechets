import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryResolvers, RegistryDelegation } from "@td/codegen-back";
import { checkCanAccess } from "../../permissions";
import { parseQueryRegistryDelegationArgs } from "../../validation";
import { fixTyping } from "../typing";
import { findDelegationByIdOrThrow } from "../utils";

const registryDelegationResolver: QueryResolvers["registryDelegation"] = async (
  _,
  args,
  context
): Promise<RegistryDelegation> => {
  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of args
  const { delegationId } = parseQueryRegistryDelegationArgs(args);

  // Fetch delegation
  const delegation = await findDelegationByIdOrThrow(user, delegationId);

  // Make sure user can access delegation
  await checkCanAccess(user, delegation);

  return fixTyping(delegation);
};

export default registryDelegationResolver;
