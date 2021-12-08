import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { getUid } from "../../../utils";
import { ApplicationInputSchema } from "../../validation";

const createApplicationResolver: MutationResolvers["createApplication"] =
  async (_, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    await ApplicationInputSchema.validate(input, { abortEarly: false });

    const application = await prisma.application.create({
      data: {
        name: input.name,
        logoUrl: input.logoUrl,
        redirectUris: input.redirectUris,
        admin: {
          connect: {
            id: user.id
          }
        },
        clientSecret: getUid(40)
      }
    });

    return application;
  };

export default createApplicationResolver;
