import { rule, and } from "graphql-shield";
import { Prisma } from "../generated/prisma-client";
import {
  NotLoggedIn,
  MissingSirets,
  MissingSiret,
  NotCompaniesAdmin,
  NotCompanyAdmin,
  NotCompanyMember
} from "./errors";
import { GraphQLContext } from "../types";
import { AuthType } from "../auth";

export const isAuthenticated = rule({ cache: "contextual" })(
  async (_1, _2, ctx) => {
    const user = ctx.user;
    return !!user || new NotLoggedIn();
  }
);

export const isAuthenticatedFromUI = chain(
  isAuthenticated,
  rule({ cache: "contextual" })(async (_1, _2, ctx: GraphQLContext) => {
    return (
      ctx.user?.auth === AuthType.Session ||
      new ForbiddenError(
        "Cette opération n'est accessible que depuis l'interface graphique Trackdéchets"
      )
    );
  })
);

export const isCompanyAdmin = chain(
  isAuthenticated,
  rule()(async (_, { siret }: { siret?: string }, ctx) => {
    if (siret == null) {
      return new MissingSiret();
    }

    const isAuthorized = await isUserInCompaniesWithRoles(
      ctx.user.id,
      [siret],
      ["ADMIN"],
      ctx.prisma
    );

    return isAuthorized || new NotCompanyAdmin(siret);
  })
);

export const isCompanyMember = chain(
  isAuthenticated,
  rule()(async (_, { siret }: { siret?: string }, ctx) => {
    if (siret == null) {
      return new MissingSiret();
    }

    const isAuthorized = await isUserInCompaniesWithRoles(
      ctx.user.id,
      [siret],
      ["MEMBER"],
      ctx.prisma
    );

    return isAuthorized || new NotCompanyMember(siret);
  })
);

export const isCompaniesUser = chain(
  isAuthenticated,
  rule()(async (_, { sirets }: { sirets?: string[] }, ctx) => {
    if (sirets == null) {
      return new MissingSirets();
    }

    const isAuthorized = await isUserInCompaniesWithRoles(
      ctx.user.id,
      sirets,
      ["MEMBER", "ADMIN"],
      ctx.prisma
    );

    return isAuthorized || new NotCompaniesAdmin(sirets);
  })
);

/**
 * Checks if `userId` is in the companies with `siret` as a ons of the `expectedRoles`
 *
 * @param userId
 * @param sirets
 * @param expectedRoles
 * @param prisma
 */
export async function isUserInCompaniesWithRoles(
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
