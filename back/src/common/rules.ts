import { rule } from "graphql-shield";

/**************************
 * Common permissions rules
 **************************/

export const isAuthenticated = rule()(async (_1, _2, ctx) => {
  const user = ctx.user;
  return !!user;
});

/**
 *
 * @param userId
 * @param siret
 * @param prisma
 */
export async function checkIsCompanyAdmin(userId, siret, prisma) {
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
    return role === "ADMIN";
  }
}

export const isCompanyAdmin = rule()(async (_, { siret }, ctx) => {
  if (ctx.user && siret) {
    return await checkIsCompanyAdmin(ctx.user.id, siret, ctx.prisma);
  }
  return false;
});
