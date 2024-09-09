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
  checkNoOverlappingDelegation
} from "./createRndtsDeclarationDelegation.utils";

const createRndtsDeclarationDelegation = async (
  _: ResolversParentTypes["Mutation"],
  { input }: MutationCreateRndtsDeclarationDelegationArgs,
  context: GraphQLContext
) => {
  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of creation input
  const delegationInput = parseCreateRndtsDeclarationDelegationInput(input);

  // Fetch companies
  const { delegator } = await findDelegateAndDelegatorOrThrow(delegationInput);

  // Make sure user can create delegation
  await checkCanCreate(user, delegator);

  // Check there's not already an active delegation
  await checkNoOverlappingDelegation(user, delegationInput);

  // Create delegation
  const delegation = await createDelegation(user, delegationInput);

  // TODO: send mail

  return delegation;
};

export default createRndtsDeclarationDelegation;
