import { applyAuthStrategies, AuthType } from "../../../../auth";
import { checkIsAuthenticated } from "../../../../common/permissions";
import type { QueryResolvers } from "@td/codegen-back";
import { parseQueryAdminRequestsArgs } from "../../../validation";
import { getPaginatedDelegations } from "./utils/adminRequests.utils";
import { fixPaginatedTyping } from "../../typing";

const adminRequestsResolver: QueryResolvers["adminRequests"] = async (
  _,
  args,
  context
) => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of args
  const { skip, first } = parseQueryAdminRequestsArgs(args);

  // Get paginated delegations
  const paginatedDelegations = await getPaginatedDelegations(user, {
    skip,
    first
  });

  return fixPaginatedTyping(paginatedDelegations);
};

export default adminRequestsResolver;
