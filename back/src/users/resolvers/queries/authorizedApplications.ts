import { AuthorizedApplication, QueryResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "@td/prisma";

const authorizedApplicationsResolver: QueryResolvers["authorizedApplications"] =
  async (_parent, _args, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    const accessTokens = await prisma.accessToken.findMany({
      where: {
        userId: user.id,
        applicationId: { not: null },
        isRevoked: false
      },
      include: { application: { include: { admin: true } } }
    });

    // It is possible that the same app retrieved several tokens from the
    // same user, so we have to make sure the items are unique and to compute the most
    // recent `lastConnection` value
    const authorizedApplicationsById = accessTokens.reduce(
      (acc, accessToken) => {
        const application = accessToken.application;
        if (!application) return acc;

        if (acc[application.id]) {
          const current = acc[application.id];
          let lastConnection = current.lastConnection;
          if (lastConnection && accessToken.lastUsed) {
            lastConnection = new Date(
              Math.max(lastConnection.getTime(), accessToken.lastUsed.getTime())
            );
          }
          return { ...acc, [application.id]: { ...current, lastConnection } };
        } else {
          return {
            ...acc,
            [application.id]: {
              id: application.id,
              name: application.name,
              admin: application.admin?.email,
              lastConnection: accessToken.lastUsed
                ? new Date(accessToken.lastUsed)
                : undefined
            }
          };
        }
      },
      {} as { [key: string]: AuthorizedApplication }
    );

    return Object.values(authorizedApplicationsById);
  };

export default authorizedApplicationsResolver;
