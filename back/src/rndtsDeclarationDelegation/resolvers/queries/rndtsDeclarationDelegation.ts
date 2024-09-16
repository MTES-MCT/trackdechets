import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { checkCanAccess } from "../../permissions";
import { parseQueryRndtsDeclarationDelegationArgs } from "../../validation";
import { findDelegationByIdOrThrow } from "../utils";

const rndtsDeclarationDelegationResolver: QueryResolvers["rndtsDeclarationDelegation"] =
  async (_, args, context) => {
    // Browser only
    applyAuthStrategies(context, [AuthType.Session]);

    // User must be authenticated
    const user = checkIsAuthenticated(context);

    // Sync validation of args
    const { delegationId } = parseQueryRndtsDeclarationDelegationArgs(args);

    // Fetch delegation
    // TODO: include or rather in sub-resolvers?
    const delegation = await findDelegationByIdOrThrow(user, delegationId, {
      include: { delegate: true, delegator: true }
    });

    // Make sure user can access delegation
    await checkCanAccess(user, delegation);

    return delegation;
  };

export default rndtsDeclarationDelegationResolver;
