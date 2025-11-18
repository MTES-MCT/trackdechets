import { applyAuthStrategies, AuthType } from "../../../../auth/auth";
import { checkIsAuthenticated } from "../../../../common/permissions";
import type { QueryResolvers } from "@td/codegen-back";
import { parseQueryAdminRequestsArgs } from "../../../validation";
import { getPaginatedAdminRequests } from "./utils/adminRequests.utils";
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

  // Get paginated requests
  const paginatedRequests = await getPaginatedAdminRequests(
    user,
    { userId: user.id },
    {
      skip,
      first
    }
  );

  return fixPaginatedTyping(paginatedRequests);
};

export default adminRequestsResolver;
