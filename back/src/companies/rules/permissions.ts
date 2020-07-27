import {
  isAuthenticated,
  isUserInCompaniesWithRoles
} from "../../common/rules";
import { rule, chain } from "graphql-shield";
import { prisma } from "../../generated/prisma-client";
import { UserInputError, ForbiddenError } from "apollo-server-express";

export const canUpdateDeleteTransporterReceipt = chain(
  isAuthenticated,
  rule()(async (_, { input }, ctx) => {
    const { id } = input;

    const receipt = await prisma.transporterReceipt({ id });

    if (!receipt) {
      throw new UserInputError(`Aucune récépissé transporteur avec l'id ${id}`);
    }

    // check associated company
    const companies = await prisma.companies({
      where: { transporterReceipt: { id } }
    });

    const forbiddenError = new ForbiddenError(
      `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé transporteur`
    );

    if (companies.length <= 0) {
      // No companies associated with the receipt
      return forbiddenError;
    } else {
      const sirets = companies.map(c => c.siret);
      const isAuthorized = await isUserInCompaniesWithRoles(
        ctx.user.id,
        sirets,
        ["MEMBER", "ADMIN"],
        ctx.prisma
      );
      return isAuthorized || forbiddenError;
    }
  })
);

export const canUpdateDeleteTraderReceipt = chain(
  isAuthenticated,
  rule()(async (_, { input }, ctx) => {
    const { id } = input;

    const receipt = await prisma.traderReceipt({ id });

    if (!receipt) {
      throw new UserInputError(`Aucune récépissé négociant avec l'id ${id}`);
    }

    // check associated company
    const companies = await prisma.companies({
      where: { traderReceipt: { id } }
    });

    const forbiddenError = new ForbiddenError(
      `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé négociant`
    );

    if (companies.length <= 0) {
      // No companies associated with the receipt
      return forbiddenError;
    } else {
      const sirets = companies.map(c => c.siret);
      const isAuthorized = await isUserInCompaniesWithRoles(
        ctx.user.id,
        sirets,
        ["MEMBER", "ADMIN"],
        ctx.prisma
      );
      return isAuthorized || forbiddenError;
    }
  })
);
