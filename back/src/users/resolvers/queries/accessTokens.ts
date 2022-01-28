import { QueryResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import prisma from "../../../prisma";

const accessTokensResolver: QueryResolvers["accessTokens"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const accessTokens = await prisma.accessToken.findMany({
    where: { userId: user.id, isRevoked: false }
  });
  return accessTokens.map(token => ({
    description: token.description,
    lastUsed: token.lastUsed,
    tokenPreview: `${token.token.slice(0, 5)}*************`
  }));
};

export default accessTokensResolver;
