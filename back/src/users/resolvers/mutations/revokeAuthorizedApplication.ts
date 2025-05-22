import type { MutationResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "@td/prisma";
import { getApplicationOrApplicationNotFound } from "../../../applications/database";
import { UserInputError } from "../../../common/errors";

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
    if (!owner) {
      throw new Error(`Cannot find admin for application ${application.id}`);
    }

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
      lastConnection
    };
  };

export default revokeAuthorizedApplicationResolver;
