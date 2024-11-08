import { getUserCompanies } from "../../../users/database";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { checkBelongsTo } from "../../permissions";
import { parseQueryRegistryDelegationsArgs } from "../../validation";
import { fixPaginatedTyping } from "../typing";
import { findDelegateOrDelegatorOrThrow } from "../utils";
import { getPaginatedDelegations } from "./utils/registryDelegations.utils";

const registryDelegationsResolver: QueryResolvers["registryDelegations"] =
  async (_, args, context) => {
    // Browser only
    applyAuthStrategies(context, [AuthType.Session]);

    // User must be authenticated
    const user = checkIsAuthenticated(context);

    // Sync validation of args
    const paginationArgs = parseQueryRegistryDelegationsArgs(args);

    const { delegateOrgId, delegatorOrgId, givenToMe, activeOnly, search } =
      paginationArgs.where;

    // Find targeted company
    const { delegate, delegator } = await findDelegateOrDelegatorOrThrow(
      delegateOrgId,
      delegatorOrgId
    );

    // Check that user belongs to company
    if (delegate) await checkBelongsTo(user, delegate);
    if (delegator) await checkBelongsTo(user, delegator);

    const delegates = delegate ? [delegate] : [];
    if (givenToMe) {
      const userCompanies = await getUserCompanies(user.id);
      delegates.push(...userCompanies);
    }

    // Get paginated delegations
    const paginatedDelegations = await getPaginatedDelegations(user, {
      delegates,
      delegator,
      activeOnly,
      search,
      skip: paginationArgs.skip,
      first: paginationArgs.first
    });

    return fixPaginatedTyping(paginatedDelegations);
  };

export default registryDelegationsResolver;
