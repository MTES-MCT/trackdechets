import { sendMail } from "../common/mails.helper";
import { getUserCompanies } from "../companies/queries";
import { prisma } from "../generated/prisma-client";
import { GraphQLContext } from "../types";
import { userMails } from "./mails";
import {
  changePassword,
  editProfile,
  inviteUserToCompany,
  resendInvitation,
  login,
  joinWithInvite
} from "./mutations";
import signup from "./mutations/signup";
import { hashPassword } from "./utils";
import { apiKey } from "./queries";

export default {
  Mutation: {
    signup,
    login: async (_parent, { email, password }) => login(email, password),
    changePassword: async (_, { oldPassword, newPassword }, context) => {
      const userId = context.user.id;
      return changePassword(userId, oldPassword, newPassword);
    },
    resetPassword: async (_, { email }, context: GraphQLContext) => {
      const user = await context.prisma.user({ email }).catch(_ => null);

      if (!user) {
        throw new Error(`Cet email n'existe pas sur notre plateforme.`);
      }

      const newPassword = Math.random()
        .toString(36)
        .slice(-10);
      const hashedPassword = await hashPassword(newPassword);
      await prisma.updateUser({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      await sendMail(
        userMails.resetPassword(user.email, user.name, newPassword)
      );
    },
    editProfile: (_, payload, context) => {
      const userId = context.user.id;
      return editProfile(userId, payload);
    },
    inviteUserToCompany: async (
      _,
      { email, siret, role },
      context: GraphQLContext
    ) => inviteUserToCompany(context.user, email, siret, role),
    resendInvitation: async (_, { email, siret }, context: GraphQLContext) =>
      resendInvitation(context.user, email, siret),
    joinWithInvite: async (_, { inviteHash, name, password }) =>
      joinWithInvite(inviteHash, name, password),
    removeUserFromCompany: async (_, { userId, siret }) => {
      await prisma
        .deleteManyCompanyAssociations({
          user: { id: userId },
          company: { siret }
        })
        .catch(_ => {
          throw new Error(
            `Erreur, l'utilisateur n'a pas pu être retiré de l'entreprise`
          );
        });

      const company = await prisma.company({ siret });

      return company;
    },

    deleteInvitation: async (_, { email, siret }) => {
      const deletedAccountHash = await prisma
        .deleteManyUserAccountHashes({ email, companySiret: siret })
        .catch(err => {
          throw new Error(`Erreur, l'invitation n'a pas pu être supprimée`);
        });
      return prisma.company({ siret });
    }
  },
  Query: {
    me: async (parent, _, context) => {
      const userId = context.user.id;
      return context.prisma.user({ id: userId });
    },
    apiKey: (_parent, _args, context: GraphQLContext) => apiKey(context.user)
  },
  User: {
    companies: async parent => {
      return await getUserCompanies(parent.id);
    }
  }
};
