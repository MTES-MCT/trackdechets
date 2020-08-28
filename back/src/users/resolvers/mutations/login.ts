import { prisma } from "../../../generated/prisma-client";
import { compare } from "bcrypt";
import { apiKey } from "../../queries";
import { UserInputError, ForbiddenError } from "apollo-server-express";
import { MutationResolvers } from "../../../generated/graphql/types";

/**
 * DEPRECATED
 * Third party apps will use OAuth2
 * and TD interface uses POST /login
 * @param email
 * @param password
 */
const loginResolver: MutationResolvers["login"] = async (
  parent,
  { email, password }
) => {
  const user = await prisma.user({ email: email.trim() });
  if (!user) {
    throw new UserInputError(`Aucun utilisateur trouvé avec l'email ${email}`, {
      invalidArgs: ["email"]
    });
  }
  if (!user.isActive) {
    throw new ForbiddenError(
      `Ce compte n'a pas encore été activé. Vérifiez vos emails ou contactez le support.`
    );
  }
  const passwordValid = await compare(password, user.password);
  if (!passwordValid) {
    throw new UserInputError("Mot de passe incorrect", {
      invalidArgs: ["password"]
    });
  }

  const token = await apiKey(user);

  return {
    token,
    user
  };
};

export default loginResolver;
