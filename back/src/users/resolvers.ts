import axios from "axios";
import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { APP_SECRET, getUserId } from "../utils";
import { Context } from "../types";
import { prisma } from "../generated/prisma-client";

export default {
  Mutation: {
    signup: async (parent, { payload }, context: Context) => {
      const existingCompany = await context.prisma.company({
        siret: payload.siret
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
          company: {
            create: { siret: payload.siret }
          }
        })
        .catch(_ => {
          throw new Error(
            "Impossible de créer cet utilisateur. Cet email a déjà un compte associé ou le mot de passe est vide."
          );
        });

      const activationHash = await hash(
        new Date().valueOf().toString() + Math.random().toString(),
        10
      );
      await context.prisma.createUserActivationHash({
        hash: activationHash,
        user: {
          connect: { id: user.id }
        }
      });

      await axios.post("http://td-mail/send", {
        toEmail: user.email,
        toName: user.name,
        subject: "Activer votre compte sur Trackdéchets",
        title: "Activation de votre compte",
        body: `Bonjour ${user.name},
        <br>
        Vous venez de créer un compte sur Trackdéchets ! Nous sommes ravis de vous compter parmi nous ! 🎉
        <br>
        Pour finaliser votre inscription, veuillez confirmer votre email en cliquant sur le lien suivant :
        <a href="https://api.trackdechets.beta.gouv.fr/userActivation?hash=${activationHash}">https://api.trackdechets.beta.gouv.fr/userActivation?hash=${activationHash}</a>
        <br>
        Pour rappel, Trackdéchets est un site en béta conçu par la Fabrique Numérique du Ministère de l'Ecologie et des Territoires.
        <br>
        Si vous avez la moindre interrogation, n’hésitez pas à nous contacter à l'email <emmanuel.flahaut@developpement-durable.gouv.fr>.`
      });

      return {
        token: sign({ userId: user.id }, APP_SECRET),
        user
      };
    },
    login: async (parent, { email, password }, context: Context) => {
      const user = await context.prisma.user({ email });
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
    }
  },
  Query: {
    me: async (parent, _, context) => {
      const userId = getUserId(context);
      return context.prisma.user({ id: userId });
    }
  },
  User: {
    company: async (parent, args, context: Context) => {
      return await context.prisma.user({ id: parent.id }).company();
    }
  }
};
