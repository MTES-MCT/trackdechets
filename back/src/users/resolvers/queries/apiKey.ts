import type { QueryResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { createAccessToken } from "../../database";

/**
 * DEPRECATED
 * Generate a new personal token and save it to the database
 * It will disappear in favor of OAuth2 implicit grant in the future
 */
const apiKeyResolver: QueryResolvers["apiKey"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const accessToken = await createAccessToken({ user });
  return accessToken.token;
};

export default apiKeyResolver;
