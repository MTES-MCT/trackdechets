import axios from "axios";
import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { APP_SECRET, getUserId } from "../utils";
import { Context } from "../types";
import { prisma } from "../generated/prisma-client";
import { sendMail } from "../common/mails.helper";
import { userMails } from "./mails";

export default {
  Mutation: {
    signup: async (parent, { payload }, context: Context) => {
      const trimedSiret = payload.siret.replace(/\s+/g, "");

      const existingCompany = await context.prisma.$exists
        .company({
          siret: trimedSiret
        })
        .catch(err => {
          console.error("Error while checking company", err);
          throw new Error(
            "Erreur lors de la vérification du SIRET. Merci de réessayer."
          );
        });

      if (existingCompany) {
        throw new Error(
          "Cette entreprise a déjà un administrateur. Si vous pensez que c'est une erreur vous pouvez contacter le support."
        );
      }

      const hashedPassword = await hash(payload.password, 10);
      const user = await context.prisma
        .createUser({
          name: payload.name,
          email: payload.email,
          password: hashedPassword,
          phone: payload.phone,
          userType: payload.userType,
          company: {
            create: { siret: trimedSiret }
          }
        })
        .catch(err => {
          console.error("Error while creating user", err);
          throw new Error(
            "Impossible de créer cet utilisateur. Cet email a déjà un compte associé ou le mot de passe est vide."
          );
        });

      const activationHash = await hash(
        new Date().valueOf().toString() + Math.random().toString(),
        10
      );
      await context.prisma
        .createUserActivationHash({
          hash: activationHash,
          user: {
            connect: { id: user.id }
          }
        })
        .catch(err => {
          console.error("Error while creating user activation hash", err);
          throw new Error("Erreur technique. Le support a été informé.");
        });

      await sendMail(userMails.onSignup(user, activationHash));

      return {
        token: sign({ userId: user.id }, APP_SECRET),
        user
      };
    },
    login: async (parent, { email, password }, context: Context) => {
      const user = await context.prisma.user({ email: email.trim() });
      if (!user) {
        throw new Error(`Aucun utilisateur trouvé avec l'email ${email}`);
      }
      if (!user.isActive) {
        throw new Error(
          `Ce compte n'a pas encore été activé. Vérifiez vos emails ou contactez le support.`
        );
      }
      const passwordValid = await compare(password, user.password);
      if (!passwordValid) {
        throw new Error("Mot de passe incorrect");
      }
      return {
        token: sign({ userId: user.id }, APP_SECRET),
        user
      };
    },
    changePassword: async (_, { oldPassword, newPassword }, context) => {
      const userId = getUserId(context);

      const user = await context.prisma.user({ id: userId });
      const passwordValid = await compare(oldPassword, user.password);
      if (!passwordValid) {
        throw new Error("L'ancien mot de passe est incorrect.");
      }

      const hashedPassword = await hash(newPassword, 10);
      await prisma.updateUser({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      return {
        token: sign({ userId: user.id }, APP_SECRET),
        user
      };
    },
    editProfile: (_, { name, phone, email }, context) => {
      const userId = getUserId(context);

      return prisma
        .updateUser({
          where: { id: userId },
          data: { name, phone }
        })
        .catch(err => {
          console.error(
            `Error while editing profile from user #${userId} with values ${JSON.stringify(
              { name, phone, email }
            )}`,
            err
          );
          throw new Error("Impossible de mettre lr profil à jour");
        });
    }
  },
  Query: {
    me: async (parent, _, context) => {
      const userId = getUserId(context);
      return context.prisma.user({ id: userId });
    },
    apiKey: (parent, args, context: Context) => {
      const userId = getUserId(context);
      return sign({ userId: userId }, APP_SECRET);
    }
  },
  User: {
    company: async (parent, args, context: Context) => {
      return await context.prisma.user({ id: parent.id }).company();
    }
    // companies: async (parent, args, context: Context) => {
    //   return await context.prisma.user({ id: parent.id }).();
    // },
  }
};
