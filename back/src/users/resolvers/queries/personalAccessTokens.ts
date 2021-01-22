import { QueryResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { toAccessToken } from "../../database";

const personalAccessTokensResolver: QueryResolvers["personalAccessTokens"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const accessTokens = await prisma.accessToken.findMany({
    where: {
      userId: user.id,
      applicationId: null,
      isRevoked: false
    },
    orderBy: {
      lastUsed: "asc"
    }
  });

  return accessTokens.map(toAccessToken);
};

export default personalAccessTokensResolver;
