import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationCreateRndtsDeclarationDelegationArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { checkCanCreate } from "../../permissions";
import { parseCreateRndtsDeclarationDelegationInput } from "../../validation";
import { findDelegateAndDelegatorOrThrow } from "../utils";
import {
  createDelegation,
  checkNoNotRevokedandNotExpiredDelegation
} from "./createRndtsDeclarationDelegation.utils";

const createRndtsDeclarationDelegation = async (
  _: ResolversParentTypes["Mutation"],
  { input }: MutationCreateRndtsDeclarationDelegationArgs,
  context: GraphQLContext
) => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of creation input
  const delegationInput = parseCreateRndtsDeclarationDelegationInput(input);

  // Fetch companies
  const { delegator } = await findDelegateAndDelegatorOrThrow(delegationInput);

  // Make sure user can create delegation
  await checkCanCreate(user, delegator);

  // Check there's not already an existing delegation
  await checkNoNotRevokedandNotExpiredDelegation(user, delegationInput);

  // Create delegation
  const delegation = await createDelegation(user, delegationInput);

  // TODO: send mail

  return delegation;
};

export default createRndtsDeclarationDelegation;
