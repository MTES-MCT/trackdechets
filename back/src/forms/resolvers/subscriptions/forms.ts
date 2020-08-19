import { SubscriptionResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { AuthenticationError } from "apollo-server-express";
import { getUserCompanies } from "../../../users/database";

const formResolvers: SubscriptionResolvers["forms"] = {
  subscribe: async (parent, { token }) => {
    // Web socket has no headers so we pass the token as a param

    const user = await prisma.accessToken({ token }).user();

    if (!user) {
      throw new AuthenticationError("Vous n'êtes pas connecté");
    }

    const userCompanies = await getUserCompanies(user.id);

    return prisma.$subscribe.form({
      OR: [
        ...userCompanies.map(userCompany => ({
          node: { emitterCompanySiret: userCompany.siret }
        })),
        ...userCompanies.map(userCompany => ({
          node: { recipientCompanySiret: userCompany.siret }
        })),
        { node: { owner: { id: user.id } } }
      ]
    });
  },
  resolve: payload => {
    return payload;
  }
};

export default formResolvers;
