import { applyAuthStrategies, AuthType } from "../../../../auth/auth";
import { checkIsAuthenticated } from "../../../../common/permissions";
import type { QueryResolvers } from "@td/codegen-back";
import { parseQueryAdminRequestsAdminArgs } from "../../../validation";
import { getPaginatedAdminRequests } from "./utils/adminRequests.utils";
import { fixPaginatedTyping } from "../../typing";
import { ForbiddenError } from "../../../../common/errors";
import { isDefinedStrict } from "../../../../common/helpers";

const adminRequestsAdminResolver: QueryResolvers["adminRequestsAdmin"] = async (
  _,
  args,
  context
) => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  if (!user.isAdmin) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
  }

  // Sync validation of args
  const {
    input: { skip, first, siret, date }
  } = parseQueryAdminRequestsAdminArgs(args);

  // Build where clause
  let where = {};
  if (isDefinedStrict(siret)) {
    where = {
      ...where,
      company: {
        siret: siret
      }
    };
  }

  if (isDefinedStrict(date)) {
    const startOfDay = new Date(date!);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date!);
    endOfDay.setHours(23, 59, 59, 999);

    where = {
      ...where,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    };
  }

  // Get paginated requests
  const paginatedRequests = await getPaginatedAdminRequests(user, where, {
    skip,
    first
  });

  return fixPaginatedTyping(paginatedRequests);
};

export default adminRequestsAdminResolver;
