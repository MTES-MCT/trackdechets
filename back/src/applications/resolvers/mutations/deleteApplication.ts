import { applyAuthStrategies, AuthType } from "../../../auth";
import { ForbiddenError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { getApplicationOrApplicationNotFound } from "../../database";

const deleteApplicationResolver: MutationResolvers["deleteApplication"] =
  async (_, { id }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    const existingApplication = await getApplicationOrApplicationNotFound({
      id
    });

    if (existingApplication.adminId !== user.id) {
      throw new ForbiddenError(
        "Vous n'êtes pas autorisé à supprimer cette application"
      );
    }

    await prisma.accessToken.updateMany({
      where: { applicationId: existingApplication.id },
      data: { isRevoked: true }
    });

    await prisma.grant.deleteMany({
      where: { applicationId: existingApplication.id }
    });

    await prisma.application.delete({
      where: { id: existingApplication.id }
    });

    return existingApplication;
  };

export default deleteApplicationResolver;
