import prisma from "../../prisma";
import { BsffResolvers } from "../../generated/graphql/types";
import { toInitialBsff, expandBsffFromDB } from "../converter";
import { getFicheInterventions } from "../database";
import { dashboardOperationName } from "../../common/queries";
import { isSessionUser } from "../../auth";

export const Bsff: BsffResolvers = {
  ficheInterventions: async ({ id }, _, context) => {
    const prismaBsff = await prisma.bsff.findUnique({
      where: { id }
    });
    return getFicheInterventions({ bsff: prismaBsff, context });
  },
  forwardedIn: async ({ id }) => {
    const forwardingBsff = await prisma.bsff
      .findUnique({
        where: { id }
      })
      .forwardedIn();
    return forwardingBsff ? expandBsffFromDB(forwardingBsff) : null;
  },
  forwarding: async ({ id }) => {
    const forwardedBsff = await prisma.bsff
      .findUnique({
        where: { id }
      })
      .forwarding();
    return forwardedBsff
      ? toInitialBsff(expandBsffFromDB(forwardedBsff))
      : null;
  },
  repackagedIn: async ({ id }) => {
    const repackagingBsff = await prisma.bsff
      .findUnique({ where: { id } })
      .repackagedIn();
    return repackagingBsff ? expandBsffFromDB(repackagingBsff) : null;
  },
  repackaging: async ({ id }) => {
    const repackagedBsffs = await prisma.bsff
      .findUnique({ where: { id } })
      .repackaging();
    return repackagedBsffs.map(bsff => toInitialBsff(expandBsffFromDB(bsff)));
  },
  groupedIn: async ({ id }) => {
    const groupingBsff = await prisma.bsff
      .findUnique({ where: { id } })
      .groupedIn();
    return groupingBsff ? expandBsffFromDB(groupingBsff) : null;
  },
  grouping: async ({ id }) => {
    const groupedBsffs = await prisma.bsff
      .findUnique({ where: { id } })
      .grouping();
    return groupedBsffs.map(bsff => toInitialBsff(expandBsffFromDB(bsff)));
  },
  packagings: async (bsff, _, ctx) => {
    let packagings = [];
    // use ES indexed field when requested from dashboard
    if (
      ctx?.req?.body?.operationName === dashboardOperationName &&
      isSessionUser(ctx)
    ) {
      packagings = bsff?.packagings ?? [];
    } else {
      packagings = await prisma.bsff
        .findUnique({ where: { id: bsff.id } })
        .packagings();
    }

    return packagings.map(packaging => ({
      name: packaging.name,
      volume: packaging.volume,
      weight: packaging.weight,
      numero: packaging.numero
    }));
  }
};
