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
      where: { userId: user.id, applicationId: { not: null } },
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

    // oauth2 protocol should prevent issuing several tokens for the
    // the same user and application but this is not enforced at
    // database level so we make sure the items are unique and compute
    // most recent `lastConnection` value
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
