import { ApplicationResolvers } from "../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../auth";
import { checkIsAuthenticated } from "../../common/permissions";
import prisma from "../../prisma";
import { toAccessToken } from "../database";

const applicationResolvers: ApplicationResolvers = {
  accessTokens: async (parent, _, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const accessTokens = await prisma.accessToken.findMany({
      where: {
        userId: user.id,
        applicationId: parent.id,
        isRevoked: false
      }
    });

    return accessTokens.map(toAccessToken);
  }
};

export default applicationResolvers;
