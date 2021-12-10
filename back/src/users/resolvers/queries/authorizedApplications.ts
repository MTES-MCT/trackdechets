import {
  AuthorizedApplication,
  QueryResolvers
} from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import prisma from "../../../prisma";

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
    const authorizedApplications = accessTokens.map(token => {
      const application = token.application;
      return {
        id: application.id,
        name: application.name,
        admin: application.admin.email,
        logoUrl: application.logoUrl,
        lastConnection: token.lastUsed
      };
    });

    // It is possible that the same app retrieved several tokens from the
    // same user, so we have to make sure the items are unique and to compute the most
    // recent `lastConnection` value
    const authorizedApplicationsById = authorizedApplications.reduce(
      (acc, application) => {
        if (acc[application.id]) {
          const current = acc[application.id];
          const lastConnection =
            current.lastConnection || application.lastConnection
              ? new Date(
                  Math.max(
                    current.lastConnection?.getTime(),
                    application.lastConnection?.getTime()
                  )
                )
              : null;
          return { ...acc, [application.id]: { ...current, lastConnection } };
        } else {
          return {
            ...acc,
            [application.id]: application
          };
        }
      },
      {} as { [key: string]: AuthorizedApplication }
    );

    return Object.values(authorizedApplicationsById);
  };

export default authorizedApplicationsResolver;
