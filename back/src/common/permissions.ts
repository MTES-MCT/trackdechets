import { prisma } from "@td/prisma";
import { GraphQLContext } from "../types";
import { InvaliSecurityCode, NotAdmin, NotLoggedIn } from "./errors";
import { protectSecurityCodeValidation } from "./security/bruteForceProtection";

export function checkIsAuthenticated(context: GraphQLContext): Express.User {
  if (!context.user) {
    throw new NotLoggedIn();
  }
  return context.user;
}

export function checkIsAdmin(context: GraphQLContext): Express.User {
  const user = checkIsAuthenticated(context);
  if (!user.isAdmin || !user.totpActivatedAt || !user.totpSeed) {
    throw new NotAdmin();
  }
  return user;
}

export async function checkSecurityCode(
  userId: string,
  siret: string,
  securityCode: number
) {
  return protectSecurityCodeValidation(
    `${userId}:${siret}`, // Use combination of userId and siret as identifier
    async () => {
      const exists = await prisma.company.findFirst({
        where: { orgId: siret, securityCode }
      });
      if (!exists) {
        throw new InvaliSecurityCode();
      }
      return true;
    },
    {
      action: "security_code_validation"
    }
  );
}
