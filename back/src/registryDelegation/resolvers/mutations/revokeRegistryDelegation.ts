import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  MutationRevokeRegistryDelegationArgs,
  ResolversParentTypes,
  RegistryDelegation
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { checkCanRevoke } from "../../permissions";
import { parseMutationRevokeRegistryDelegationArgs } from "../../validation";
import { fixTyping } from "../typing";
import { findDelegationByIdOrThrow } from "../utils";
import { revokeDelegation } from "./utils/revokeRegistryDelegation.utils";

const revokeRegistryDelegation = async (
  _: ResolversParentTypes["Mutation"],
  args: MutationRevokeRegistryDelegationArgs,
  context: GraphQLContext
): Promise<RegistryDelegation> => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of input
  const { delegationId } = parseMutationRevokeRegistryDelegationArgs(args);

  // Fetch delegation
  const delegation = await findDelegationByIdOrThrow(user, delegationId);

  // Make sure user can revoke delegation
  await checkCanRevoke(user, delegation);

  // Revoke delegation
  const revokedDelegation = await revokeDelegation(user, delegation);

  return fixTyping(revokedDelegation);
};

export default revokeRegistryDelegation;
