import { ForbiddenError } from "apollo-server-core";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { getApplicationOrApplicationNotFound } from "../../database";
import { applicationSchema } from "../../validation";

const updateApplicationResolver: MutationResolvers["updateApplication"] =
  async (_, { id, input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    const existingApplication = await getApplicationOrApplicationNotFound({
      id
    });

    if (existingApplication.adminId !== user.id) {
      throw new ForbiddenError(
        "Vous n'êtes pas autorisé à modifier cette application"
      );
    }

    await applicationSchema.validate(
      { ...existingApplication, ...input },
      { abortEarly: false }
    );

    const updatedApplication = await prisma.application.update({
      where: { id: existingApplication.id },
      data: input
    });

    return updatedApplication;
  };

export default updateApplicationResolver;
