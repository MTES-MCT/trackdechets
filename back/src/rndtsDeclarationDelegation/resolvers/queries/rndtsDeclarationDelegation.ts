import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { checkCanAccess } from "../../permissions";
import { parseQueryRndtsDeclarationDelegationArgs } from "../../validation";
import { findDelegationByIdOrThrow } from "./rndtsDeclarationDelegation.utils";

const rndtsDeclarationDelegationResolver: QueryResolvers["rndtsDeclarationDelegation"] =
  async (_, args, context) => {
    // User must be authenticated
    const user = checkIsAuthenticated(context);

    // Sync validation of args
    const { id } = parseQueryRndtsDeclarationDelegationArgs(args);

    // Fetch delegation
    const delegation = await findDelegationByIdOrThrow(user, id);

    // Make sure user can access delegation
    await checkCanAccess(user, delegation);

    return delegation;
  };

export default rndtsDeclarationDelegationResolver;
