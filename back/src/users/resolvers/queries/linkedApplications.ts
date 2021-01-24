import { QueryResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";

const linkedApplicationsResolver: QueryResolvers["linkedApplications"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const applicationsAccessTokens = await prisma.accessToken.findMany({
    select: {
      application: true
    },
    where: {
      userId: user.id,
      applicationId: {
        not: null
      },
      isRevoked: false
    },
    distinct: ["applicationId"]
  });

  return applicationsAccessTokens.map(({ application }) => ({
    id: application.id,
    name: application.name,
    logoUrl: application.logoUrl,

    // the application's accessTokens are resolved separately
    accessTokens: []
  }));
};

export default linkedApplicationsResolver;
