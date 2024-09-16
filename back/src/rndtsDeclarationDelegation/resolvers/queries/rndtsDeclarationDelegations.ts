import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { parseQueryRndtsDeclarationDelegationsArgs } from "../../validation";
import { checkUserBelongsToCompany } from "../utils";
import { getPaginatedDelegations } from "./utils/rndtsDeclarationDelegations.utils";

const rndtsDeclarationDelegationsResolver: QueryResolvers["rndtsDeclarationDelegations"] =
  async (_, args, context) => {
    // Browser only
    applyAuthStrategies(context, [AuthType.Session]);

    // User must be authenticated
    const user = checkIsAuthenticated(context);

    // Sync validation of args
    const paginationArgs = parseQueryRndtsDeclarationDelegationsArgs(args);

    // Make sure user belongs to target companies
    if (paginationArgs.where?.delegateId)
      await checkUserBelongsToCompany(user, paginationArgs.where.delegateId);
    if (paginationArgs.where?.delegatorId)
      await checkUserBelongsToCompany(user, paginationArgs.where.delegatorId);

    // Get paginated delegations
    const paginatedDelegations = await getPaginatedDelegations(
      user,
      paginationArgs
    );

    return paginatedDelegations;
  };

export default rndtsDeclarationDelegationsResolver;
