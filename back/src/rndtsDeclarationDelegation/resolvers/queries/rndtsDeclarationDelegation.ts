import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  QueryResolvers,
  RndtsDeclarationDelegation
} from "../../../generated/graphql/types";
import { checkCanAccess } from "../../permissions";
import { parseQueryRndtsDeclarationDelegationArgs } from "../../validation";
import { fixTyping } from "../typing";
import { findDelegationByIdOrThrow } from "../utils";

const rndtsDeclarationDelegationResolver: QueryResolvers["rndtsDeclarationDelegation"] =
  async (_, args, context): Promise<RndtsDeclarationDelegation> => {
    // Browser only
    applyAuthStrategies(context, [AuthType.Session]);

    // User must be authenticated
    const user = checkIsAuthenticated(context);

    // Sync validation of args
    const { delegationId } = parseQueryRndtsDeclarationDelegationArgs(args);

    // Fetch delegation
    const delegation = await findDelegationByIdOrThrow(user, delegationId);

    // Make sure user can access delegation
    await checkCanAccess(user, delegation);

    return fixTyping(delegation);
  };

export default rndtsDeclarationDelegationResolver;
