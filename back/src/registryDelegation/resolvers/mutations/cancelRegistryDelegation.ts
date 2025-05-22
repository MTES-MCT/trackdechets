import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  ResolversParentTypes,
  RegistryDelegation,
  MutationCancelRegistryDelegationArgs
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { checkCanCancel } from "../../permissions";
import { parseMutationRevokeRegistryDelegationArgs } from "../../validation";
import { fixTyping } from "../typing";
import { findDelegationByIdOrThrow } from "../utils";
import { cancelDelegation } from "./utils/cancelRegistryDelegation.utils";

const cancelRegistryDelegation = async (
  _: ResolversParentTypes["Mutation"],
  args: MutationCancelRegistryDelegationArgs,
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

  // Make sure user can cancel delegation
  await checkCanCancel(user, delegation);

  // Cancel delegation
  const cancelledDelegation = await cancelDelegation(user, delegation);

  return fixTyping(cancelledDelegation);
};

export default cancelRegistryDelegation;
