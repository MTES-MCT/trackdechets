import { QueryResolvers } from "../../../generated/graphql/types";
import { getUid } from "../../../utils";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "../../../generated/prisma-client";

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

  const token = getUid(40);

  const accessToken = await prisma.createAccessToken({
    user: {
      connect: { id: user.id }
    },
    token
  });

  return accessToken.token;
};

export default apiKeyResolver;
