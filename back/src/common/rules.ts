import { rule, and } from "graphql-shield";

import { Prisma } from "../generated/prisma-client";
import { DomainError, ErrorCode } from "./errors";

/**************************
 * Common permissions rules
 **************************/

export const isAuthenticated = rule({ cache: "contextual" })(
  async (_1, _2, ctx) => {
    const user = ctx.user;
    return (
      !!user ||
      new DomainError(`Vous n'êtes pas connecté.`, ErrorCode.FORBIDDEN)
    );
  }
);

export const isCompanyAdmin = and(
  isAuthenticated,
  rule()(async (_, { siret }, ctx) => {
    ensureRuleParametersArePresent(siret);

    const isCompanyAdmin = await isUserInCompanyWithRole(
      ctx.user.id,
      siret,
      "ADMIN",
      ctx.prisma
    );

    return (
      isCompanyAdmin ||
      new DomainError(
        `Vous n'êtes pas administrateur de l'entreprise "${siret}".`,
        ErrorCode.FORBIDDEN
      )
    );
  })
);

export const isCompanyMember = and(
  isAuthenticated,
  rule()(async (_, { siret }, ctx) => {
    ensureRuleParametersArePresent(siret);

    const isCompanyMember = await isUserInCompanyWithRole(
      ctx.user.id,
      siret,
      "MEMBER",
      ctx.prisma
    );

    return (
      isCompanyMember ||
      new DomainError(
        `Vous ne faites pas partie de l'entreprise "${siret}".`,
        ErrorCode.FORBIDDEN
      )
    );
  })
);

export function ensureRuleParametersArePresent(...params: any[]) {
  for (const param of params) {
    if (!param) {
      throw new Error(`⚠ A required rule parameter is missing!`);
    }
  }
}

/**
 * Checks if `userId` is in the company with `siret` as a `expectedRole`
 *
 * @param userId
 * @param siret
 * @param expectedRole
 * @param prisma
 */
async function isUserInCompanyWithRole(
  userId: string,
  siret: string,
  expectedRole: "MEMBER" | "ADMIN",
  prisma: Prisma
) {
  const associations = await prisma.companyAssociations({
    where: {
      user: {
        id: userId
      },
      company: {
        siret
      }
    }
  });

  if (associations.length == 0) {
    return false;
  } else {
    return associations.some(({ role }) => role === expectedRole);
  }
}
