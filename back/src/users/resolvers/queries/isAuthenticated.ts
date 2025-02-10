import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { QueryResolvers } from "@td/codegen-back";

const isAuthenticatedResolver: QueryResolvers["isAuthenticated"] = async (
  _,
  __,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);

  try {
    checkIsAuthenticated(context);
    return true;
  } catch (_) {
    return false;
  }
};

export default isAuthenticatedResolver;
