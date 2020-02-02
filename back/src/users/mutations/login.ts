import { prisma } from "../../generated/prisma-client";
import { DomainError, ErrorCode } from "../../common/errors";
import { compare } from "bcrypt";
import { apiKey } from "../queries";

/**
 * DEPRECATED
 * Third party apps will use OAuth2
 * and TD interface uses POST /login
 * @param email
 * @param password
 */
export async function login(email: string, password: string) {
  const user = await prisma.user({ email: email.trim() });
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

  const token = await apiKey(user);

  return {
    token,
    user
  };
}
