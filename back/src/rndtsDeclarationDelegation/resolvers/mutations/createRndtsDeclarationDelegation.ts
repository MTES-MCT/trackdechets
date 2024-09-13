import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationCreateRndtsDeclarationDelegationArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { checkCanCreate } from "../../permissions";
import { parseCreateRndtsDeclarationDelegationInput } from "../../validation";
import {
  findDelegateAndDelegatorOrThrow,
  findDelegationByIdOrThrow
} from "../utils";
import {
  createDelegation,
  checkNoExistingNotRevokedAndNotExpiredDelegation
} from "./utils/createRndtsDeclarationDelegation.utils";

const createRndtsDeclarationDelegation = async (
  _: ResolversParentTypes["Mutation"],
  { input }: MutationCreateRndtsDeclarationDelegationArgs,
  context: GraphQLContext
) => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of input
  const delegationInput = parseCreateRndtsDeclarationDelegationInput(input);

  // Fetch companies
  const { delegator, delegate } = await findDelegateAndDelegatorOrThrow(
    delegationInput.delegateOrgId,
    delegationInput.delegatorOrgId
  );

  // Make sure user can create delegation
  await checkCanCreate(user, delegator);

  // Check there's not already an existing delegation
  await checkNoExistingNotRevokedAndNotExpiredDelegation(
    user,
    delegator,
    delegate
  );

  // Create delegation
  const delegation = await createDelegation(
    user,
    delegationInput,
    delegator,
    delegate
  );

  // Return full object
  return findDelegationByIdOrThrow(user, delegation.id, {
    include: { delegate: true, delegator: true }
  });
};

export default createRndtsDeclarationDelegation;
