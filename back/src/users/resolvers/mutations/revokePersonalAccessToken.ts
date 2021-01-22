import { UserInputError } from "apollo-server-express";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth";
import prisma from "../../../prisma";
import { toAccessToken } from "../../database";

const revokePersonalAccessTokenResolver: MutationResolvers["revokePersonalAccessToken"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const accessToken = await prisma.accessToken.findFirst({
    where: {
      id: args.id,
      userId: user.id,
      isRevoked: false
    }
  });

  if (accessToken == null) {
    throw new UserInputError("Cette clé d'API n'existe pas.");
  }

  await prisma.accessToken.update({
    data: {
      isRevoked: true
    },
    where: {
      id: args.id
    }
  });

  return toAccessToken(accessToken);
};

export default revokePersonalAccessTokenResolver;
