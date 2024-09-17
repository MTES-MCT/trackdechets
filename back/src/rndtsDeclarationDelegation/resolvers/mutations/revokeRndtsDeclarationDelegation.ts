import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationRevokeRndtsDeclarationDelegationArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { checkCanRevoke } from "../../permissions";
import { parseMutationRevokeRndtsDeclarationDelegationArgs } from "../../validation";
import {
  findDelegationByIdOrThrow,
  findDelegationWithCompaniesByIdOrThrow
} from "../utils";
import { revokeDelegation } from "./utils/revokeRndtsDeclarationDelegation.utils";

const revokeRndtsDeclarationDelegation = async (
  _: ResolversParentTypes["Mutation"],
  args: MutationRevokeRndtsDeclarationDelegationArgs,
  context: GraphQLContext
) => {
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
  await revokeDelegation(user, delegation);

  return findDelegationWithCompaniesByIdOrThrow(user, delegationId);
};

export default revokeRndtsDeclarationDelegation;
