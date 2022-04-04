import { MutationResolvers } from "@trackdechets/codegen/src/back.gen";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import prisma from "../../../prisma";
import { getApplicationOrApplicationNotFound } from "../../../applications/database";
import { UserInputError } from "apollo-server-core";

const revokeAuthorizedApplicationResolver: MutationResolvers["revokeAuthorizedApplication"] =
  async (_parent, { id }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const application = await getApplicationOrApplicationNotFound({ id });
    const owner = await prisma.application
      .findUnique({
        where: { id: application.id }
      })
      .admin();
    const accessTokens = await prisma.accessToken.findMany({
      where: { userId: user.id, applicationId: id }
    });
    if (accessTokens.length === 0) {
      throw new UserInputError(
        `L'application ${id} n'a pas accès à votre compte`
      );
    }

    await prisma.accessToken.updateMany({
      where: { userId: user.id, applicationId: id },
      data: { isRevoked: true }
    });

    const lastConnection = accessTokens
      .map(t => t.lastUsed)
      .sort((t1, t2) => (!t1 ? -1 : !t2 ? 1 : t1.getTime() - t2.getTime()))[0];

    return {
      id: application.id,
      name: application.name,
      admin: owner.email,
      logoUrl: application.logoUrl,
      lastConnection
    };
  };

export default revokeAuthorizedApplicationResolver;
