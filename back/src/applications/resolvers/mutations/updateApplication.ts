import { applyAuthStrategies, AuthType } from "../../../auth";
import { removeEmptyKeys } from "../../../common/converter";
import { ForbiddenError } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
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
      data: removeEmptyKeys(input)
    });

    return updatedApplication;
  };

export default updateApplicationResolver;
