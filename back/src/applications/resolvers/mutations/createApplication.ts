import { UserInputError } from "apollo-server-express";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { getUid } from "../../../utils";
import { ApplicationInputSchema } from "../../validation";

const createFicheInterventionBsff: MutationResolvers["createApplication"] = async (
  _,
  { input },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  if (user.applicationId) {
    throw new UserInputError(
      "Vous ne pouvez pas administrer plus d'une application."
    );
  }

  await ApplicationInputSchema.validate(input, { abortEarly: false });

  const application = await prisma.application.create({
    data: {
      name: input.name,
      logoUrl: input.logoUrl,
      redirectUris: input.redirectUris,
      admins: {
        connect: {
          id: user.id
        }
      },
      clientSecret: getUid(40)
    }
  });

  return application;
};

export default createFicheInterventionBsff;
