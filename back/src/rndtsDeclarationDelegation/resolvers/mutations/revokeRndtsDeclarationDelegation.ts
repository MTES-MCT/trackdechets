import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationRevokeRndtsDeclarationDelegationArgs,
  ResolversParentTypes,
  RndtsDeclarationDelegation
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { checkCanRevoke } from "../../permissions";
import { parseMutationRevokeRndtsDeclarationDelegationArgs } from "../../validation";
import { fixTyping } from "../typing";
import { findDelegationByIdOrThrow } from "../utils";
import { revokeDelegation } from "./utils/revokeRndtsDeclarationDelegation.utils";

const revokeRndtsDeclarationDelegation = async (
  _: ResolversParentTypes["Mutation"],
  args: MutationRevokeRndtsDeclarationDelegationArgs,
  context: GraphQLContext
): Promise<RndtsDeclarationDelegation> => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of input
  const { delegationId } =
    parseMutationRevokeRndtsDeclarationDelegationArgs(args);

  // Fetch delegation
  const delegation = await findDelegationByIdOrThrow(user, delegationId);

  // Make sure user can revoke delegation
  await checkCanRevoke(user, delegation);

  // Revoke delegation
  const revokedDelegation = await revokeDelegation(user, delegation);

  return fixTyping(revokedDelegation);
};

export default revokeRndtsDeclarationDelegation;
