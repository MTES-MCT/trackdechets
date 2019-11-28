import { rule } from "graphql-shield";

import { Prisma } from "../generated/prisma-client";

/**************************
 * Common permissions rules
 **************************/

export const isAuthenticated = rule({ cache: "contextual" })(
  async (_1, _2, ctx) => {
    const user = ctx.user;
    return !!user;
  }
);

export const isCompanyAdmin = rule()(async (_, { siret }, ctx) => {
  if (ctx.user && siret) {
    return await isUserInCompanyWithRole(
      ctx.user.id,
      siret,
      "ADMIN",
      ctx.prisma
    );
  }
  return false;
});

export const isCompanyMember = rule()(async (_, { siret }, ctx) => {
  if (ctx.user && siret) {
    return await isUserInCompanyWithRole(
      ctx.user.id,
      siret,
      "MEMBER",
      ctx.prisma
    );
  }
  return false;
});

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
    // there should not be more than one association
    const { role } = associations[0];
    return role === expectedRole;
  }
}
