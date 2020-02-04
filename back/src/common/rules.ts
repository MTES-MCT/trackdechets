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

    const isCompanyAdmin = await isUserInCompaniesWithRoles(
      ctx.user.id,
      [siret],
      ["ADMIN"],
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

    const isCompanyMember = await isUserInCompaniesWithRoles(
      ctx.user.id,
      [siret],
      ["MEMBER"],
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

export const isCompaniesUser = and(
  isAuthenticated,
  rule()(async (_, { sirets }, ctx) => {
    ensureRuleParametersArePresent(sirets);

    const isCompaniesUser = await isUserInCompaniesWithRoles(
      ctx.user.id,
      sirets,
      ["MEMBER", "ADMIN"],
      ctx.prisma
    );

    return (
      isCompaniesUser ||
      new DomainError(
        `Vous ne faites pas partie d'au moins une des entreprises dont les SIRETS sont "${sirets.join(
          ", "
        )}".`,
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
 * Checks if `userId` is in the companies with `siret` as a ons of the `expectedRoles`
 *
 * @param userId
 * @param sirets
 * @param expectedRoles
 * @param prisma
 */
async function isUserInCompaniesWithRoles(
  userId: string,
  sirets: string[],
  expectedRoles: ["MEMBER" | "ADMIN"] | ["MEMBER", "ADMIN"],
  prisma: Prisma
) {
  const checks = await Promise.all(
    sirets.map(async siret => {
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

      return associations.some(({ role }) => expectedRoles.includes(role));
    })
  );

  return checks.every(Boolean);
}
