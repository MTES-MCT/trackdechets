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
      const user = await context.prisma.createUser({
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        company: {
          create: { siret: payload.siret }
        }
      });

      return {
        token: sign({ userId: user.id }, APP_SECRET),
        user
      };
    },
    login: async (parent, { email, password }, context) => {
      const user = await context.prisma.user({ email });
      if (!user) {
        throw new Error(`Aucun utilisateur trouvé avec l'email ${email}`);
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
