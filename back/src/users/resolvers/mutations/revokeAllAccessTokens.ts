import type { MutationResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "@td/prisma";

const revokeAllAccessTokensResolver: MutationResolvers["revokeAllAccessTokens"] =
  async (_parent, _, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const accessTokens = await prisma.accessToken.findMany({
      where: { userId: user.id, applicationId: null, isRevoked: false }
    });
    await prisma.accessToken.updateMany({
      where: { id: { in: accessTokens.map(t => t.id) } },
      data: { isRevoked: true }
    });
    return accessTokens;
  };

export default revokeAllAccessTokensResolver;
