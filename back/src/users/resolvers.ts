import { sendMail } from "../common/mails.helper";
import { getUserPrivateCompanies } from "../companies/queries";
import { prisma } from "../generated/prisma-client";
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
import { hashPassword, generatePassword } from "./utils";
import { apiKey } from "./queries";
import {
  QueryResolvers,
  MutationResolvers,
  UserResolvers
} from "../generated/graphql/types";

const queryResolvers: QueryResolvers = {
  me: async (_parent, _args, context) => {
    const userId = context.user.id;
    return prisma.user({ id: userId });
  },
  apiKey: (_parent, _args, context) => apiKey(context.user)
};

const mutationResolvers: MutationResolvers = {
  signup: (_parent, { userInfos }) => signup(userInfos),
  login: async (_parent, args) => login(args),
  changePassword: async (_, args, context) => {
    const userId = context.user.id;
    return changePassword(userId, args);
  },
  resetPassword: async (_, { email }) => {
    const user = await prisma.user({ email }).catch(__ => null);
    if (!user) {
      throw new Error(`Cet email n'existe pas sur notre plateforme.`);
    }
    const newPassword = generatePassword();
    const hashedPassword = await hashPassword(newPassword);
    await prisma.updateUser({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    await sendMail(userMails.resetPassword(user.email, user.name, newPassword));
    return true;
  },
  editProfile: (_, args, context) => {
    const userId = context.user.id;
    return editProfile(userId, args);
  },
  inviteUserToCompany: async (_, args, context) =>
    inviteUserToCompany(context.user, args),
  resendInvitation: async (_, args, context) =>
    resendInvitation(context.user, args),
  joinWithInvite: async (_, args) => joinWithInvite(args),
  removeUserFromCompany: async (_, { userId, siret }) => {
    await prisma
      .deleteManyCompanyAssociations({
        user: { id: userId },
        company: { siret }
      })
      .catch(__ => {
        throw new Error(
          `Erreur, l'utilisateur n'a pas pu être retiré de l'entreprise`
        );
      });

    return prisma.company({ siret });
  },

  deleteInvitation: async (_, { email, siret }) => {
    try {
      await prisma.deleteManyUserAccountHashes({ email, companySiret: siret });
    } catch {
      throw new Error(`Erreur, l'invitation n'a pas pu être supprimée`);
    }
    return prisma.company({ siret });
  }
};

const userResolvers: UserResolvers = {
  companies: async parent => {
    return await getUserPrivateCompanies(parent.id);
  }
};

export default {
  Mutation: mutationResolvers,
  Query: queryResolvers,
  User: userResolvers
};
