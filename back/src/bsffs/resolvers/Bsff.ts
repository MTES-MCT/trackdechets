import prisma from "../../prisma";
import { BsffResolvers } from "../../generated/graphql/types";
import { toInitialBsff, unflattenBsff } from "../converter";
import {
  getFicheInterventions,
  getGroupingBsffsSplits,
  getGroupedBsffsSplits
} from "../database";

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
    return forwardingBsff ? unflattenBsff(forwardingBsff) : null;
  },
  forwarding: async ({ id }) => {
    const forwardedBsff = await prisma.bsff
      .findUnique({
        where: { id }
      })
      .forwarding();
    return forwardedBsff ? toInitialBsff(unflattenBsff(forwardedBsff)) : null;
  },
  repackagedIn: async ({ id }) => {
    const repackagingBsff = await prisma.bsff
      .findUnique({ where: { id } })
      .repackagedIn();
    return repackagingBsff ? unflattenBsff(repackagingBsff) : null;
  },
  repackaging: async ({ id }) => {
    const repackagedBsffs = await prisma.bsff
      .findUnique({ where: { id } })
      .repackaging();
    return repackagedBsffs.map(bsff => toInitialBsff(unflattenBsff(bsff)));
  },
  grouping: async ({ id }) => {
    const bsffSplits = await getGroupedBsffsSplits(id);
    return bsffSplits.map(({ bsff, weight }) => ({
      bsff: toInitialBsff(unflattenBsff(bsff)),
      weight
    }));
  },
  groupedIn: async ({ id }) => {
    const bsffSplits = await getGroupingBsffsSplits(id);
    return bsffSplits.map(({ bsff, weight }) => ({
      bsff: unflattenBsff(bsff),
      weight
    }));
  }
};
