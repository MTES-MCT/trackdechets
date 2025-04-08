import { getUserCompanies } from "../../../users/database";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryResolvers } from "@td/codegen-back";
import { checkBelongsTo } from "../../permissions";
import { parseQueryRegistryDelegationsArgs } from "../../validation";
import { fixPaginatedTyping } from "../typing";
import { findDelegateOrDelegatorOrThrow } from "../utils";
import { getPaginatedDelegations } from "./utils/registryDelegations.utils";
import { UserInputError } from "../../../common/errors";

const registryDelegationsResolver: QueryResolvers["registryDelegations"] =
  async (_, args, context) => {
    // User must be authenticated
    const user = checkIsAuthenticated(context);

    // Sync validation of args
    const paginationArgs = parseQueryRegistryDelegationsArgs(args);

    const { delegateOrgId, delegatorOrgId, givenToMe, activeOnly, search } =
      paginationArgs.where;
    if (delegateOrgId && givenToMe) {
      throw new UserInputError(
        "Les options delegateOrgId et givenToMe ne peuvent pas être utilisées en même temps"
      );
    }
    // Find targeted company
    const { delegate, delegator } = await findDelegateOrDelegatorOrThrow(
      delegateOrgId,
      delegatorOrgId
    );

    // Check that user belongs to the delegate company
    if (delegate) await checkBelongsTo(user, delegate);

    const delegates = delegate ? [delegate] : [];
    // this filter means that the delegations that will be returned
    // will be the ones where the user is a member on the delegate company
    if (givenToMe) {
      const userCompanies = await getUserCompanies(user.id);
      delegates.push(...userCompanies);
      // if we have delegator && givenToMe, we don't need to check if the user
      // belongs to the delegator company since he will be a member of a delegate company
    } else if (delegator) {
      await checkBelongsTo(user, delegator);
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
