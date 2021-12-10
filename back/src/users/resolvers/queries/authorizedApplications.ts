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
      where: { userId: user.id, application: { isNot: null } },
      include: { application: { include: { admin: true } } }
    });
    const authorizedApplications = accessTokens.map(token => {
      const application = token.application;
      return {
        id: application.id,
        name: application.name,
        owner: application.admin.email,
        logoUrl: application.logoUrl,
        lastConnection: token.lastUsed
      };
    });

    // oauth2 protocol may prevent issuing several tokens for the
    // the same user and application but this is not enforced at
    // database level so we make sure the items are unique
    const authorizedApplicationsById = authorizedApplications.reduce(
      (acc, application) => {
        return { ...acc, [application.id]: application };
      },
      {} as { [key: string]: AuthorizedApplication }
    );

    return Object.values(authorizedApplicationsById);
  };

export default authorizedApplicationsResolver;
