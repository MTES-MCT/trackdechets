import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { DomainError, ErrorCode } from "../common/errors";
import { sendMail } from "../common/mails.helper";
import { getUserCompanies } from "../companies/queries";
import { prisma } from "../generated/prisma-client";
import { Context } from "../types";
import { userMails } from "./mails";
import {
  changePassword,
  editProfile,
  inviteUserToCompany,
  resendInvitation
} from "./mutations";
import signup from "./queries/signup";
import { hashPassword } from "./utils";

const { JWT_SECRET } = process.env;

export default {
  Mutation: {
    signup,
    login: async (parent, { email, password }, context: Context) => {
      const user = await context.prisma.user({ email: email.trim() });
      if (!user) {
        throw new DomainError(
          `Aucun utilisateur trouvé avec l'email ${email}`,
          ErrorCode.BAD_USER_INPUT
        );
      }
      if (!user.isActive) {
        throw new DomainError(
          `Ce compte n'a pas encore été activé. Vérifiez vos emails ou contactez le support.`,
          ErrorCode.FORBIDDEN
        );
      }
      const passwordValid = await compare(password, user.password);
      if (!passwordValid) {
        throw new Error("Mot de passe incorrect");
      }
      return {
        token: sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" }),
        user
      };
    },
    changePassword: async (_, { oldPassword, newPassword }, context) => {
      const userId = context.user.id;
      return changePassword(userId, oldPassword, newPassword);
    },
    resetPassword: async (_, { email }, context: Context) => {
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
    inviteUserToCompany: async (_, { email, siret, role }, context: Context) =>
      inviteUserToCompany(context.user, email, siret, role),
    resendInvitation: async (_, { email, siret }, context: Context) =>
      resendInvitation(context.user, email, siret),
    joinWithInvite: async (
      _,
      { inviteHash, name, password },
      context: Context
    ) => {
      const existingHash = await prisma
        .userAccountHash({ hash: inviteHash })
        .catch(_ => {
          throw new Error(
            `Cette invitation n'est plus valable. Contactez le responsable de votre société.`
          );
        });

      const hashedPassword = await hashPassword(password);
      const user = await context.prisma.createUser({
        name: name,
        email: existingHash.email,
        password: hashedPassword,
        phone: "",
        isActive: true,
        companyAssociations: {
          create: {
            company: { connect: { siret: existingHash.companySiret } },
            role: existingHash.role
          }
        }
      });

      await prisma
        .deleteUserAccountHash({ hash: inviteHash })
        .catch(err =>
          console.error(`Cannot delete user account hash ${inviteHash}`, err)
        );

      return {
        token: sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" }),
        user
      };
    },
    removeUserFromCompany: async (_, { userId, siret }) => {
      await prisma
        .deleteManyCompanyAssociations({
          user: { id: userId },
          company: { siret: siret }
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
    apiKey: (parent, args, context: Context) => {
      const userId = context.user.id;
      return sign({ userId: userId }, JWT_SECRET);
    }
  },
  User: {
    companies: async parent => {
      return await getUserCompanies(parent.id);
    }
  }
};
