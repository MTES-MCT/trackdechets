import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { APP_SECRET, getUserId } from "../utils";

export default {
  Mutation: {
    signup: async (parent, { name, email, password }, context) => {
      const hashedPassword = await hash(password, 10);
      const user = await context.prisma.createUser({
        name,
        email,
        password: hashedPassword
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
    }
  },
  Query: {
    me: async (parent, _, context) => {
      const userId = getUserId(context);
      return context.prisma.user({ id: userId });
    }
  }
};
