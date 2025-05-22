import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  MutationCreateRegistryDelegationArgs,
  ResolversParentTypes,
  RegistryDelegation
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { checkCanCreate } from "../../permissions";
import { parseCreateRegistryDelegationInput } from "../../validation";
import { fixTyping } from "../typing";
import { findDelegateAndDelegatorOrThrow } from "../utils";
import {
  createDelegation,
  checkNoExistingNotRevokedAndNotExpiredDelegation,
  sendRegistryDelegationCreationEmail
} from "./utils/createRegistryDelegation.utils";

const createRegistryDelegation = async (
  _: ResolversParentTypes["Mutation"],
  { input }: MutationCreateRegistryDelegationArgs,
  context: GraphQLContext
): Promise<RegistryDelegation> => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of input
  const delegationInput = parseCreateRegistryDelegationInput(input);

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

  // Send email
  await sendRegistryDelegationCreationEmail(delegation, delegator, delegate);

  return fixTyping(delegation);
};

export default createRegistryDelegation;
