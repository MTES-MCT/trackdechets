import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { getUid } from "../../../utils";
import { applicationSchema } from "../../validation";

const createApplicationResolver: MutationResolvers["createApplication"] =
  async (_, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    await applicationSchema.validate(input, { abortEarly: false });

    const application = await prisma.application.create({
      data: {
        name: input.name,
        logoUrl: input.logoUrl,
        goal: input.goal,
        redirectUris: input.redirectUris,
        adminId: user.id,
        clientSecret: getUid(40)
      }
    });

    return application;
  };

export default createApplicationResolver;
