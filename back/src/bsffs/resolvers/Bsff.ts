import prisma from "../../prisma";
import { BsffResolvers } from "../../generated/graphql/types";
import { toInitialBsff, expandBsffFromDb } from "../converter";
import { getFicheInterventions } from "../database";

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
    return forwardingBsff ? expandBsffFromDb(forwardingBsff) : null;
  },
  forwarding: async ({ id }) => {
    const forwardedBsff = await prisma.bsff
      .findUnique({
        where: { id }
      })
      .forwarding();
    return forwardedBsff
      ? toInitialBsff(expandBsffFromDb(forwardedBsff))
      : null;
  },
  repackagedIn: async ({ id }) => {
    const repackagingBsff = await prisma.bsff
      .findUnique({ where: { id } })
      .repackagedIn();
    return repackagingBsff ? expandBsffFromDb(repackagingBsff) : null;
  },
  repackaging: async ({ id }) => {
    const repackagedBsffs = await prisma.bsff
      .findUnique({ where: { id } })
      .repackaging();
    return repackagedBsffs.map(bsff => toInitialBsff(expandBsffFromDb(bsff)));
  },
  groupedIn: async ({ id }) => {
    const groupingBsff = await prisma.bsff
      .findUnique({ where: { id } })
      .groupedIn();
    return groupingBsff ? expandBsffFromDb(groupingBsff) : null;
  },
  grouping: async ({ id }) => {
    const groupedBsffs = await prisma.bsff
      .findUnique({ where: { id } })
      .grouping();
    return groupedBsffs.map(bsff => toInitialBsff(expandBsffFromDb(bsff)));
  }
};
