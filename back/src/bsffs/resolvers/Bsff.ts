import prisma from "../../prisma";
import { BsffResolvers } from "../../generated/graphql/types";
import { unflattenBsff } from "../converter";
import {
  getFicheInterventions,
  getGroupedInBsffsSplits,
  getGroupingBsffsSplits
} from "../database";

export const Bsff: BsffResolvers = {
  ficheInterventions: async ({ id }, _, context) => {
    const prismaBsff = await prisma.bsff.findUnique({
      where: { id }
    });
    return getFicheInterventions({ bsff: prismaBsff, context });
  },
  forwardedIn: async ({ id }) => {
    const forwardedIn = await prisma.bsff
      .findUnique({
        where: { id }
      })
      .forwardedIn();
    return forwardedIn ? unflattenBsff(forwardedIn) : null;
  },
  forwarding: async ({ id }) => {
    const forwarding = await prisma.bsff
      .findUnique({
        where: { id }
      })
      .forwarding();
    return forwarding
      ? {
          id: forwarding.id,
          // ficheInterventions will be resolved in InitialBsff resolver
          ficheInterventions: []
        }
      : null;
  },
  repackagedIn: async ({ id }) => {
    const repackagedIn = await prisma.bsff
      .findUnique({ where: { id } })
      .repackagedIn();
    return repackagedIn ? unflattenBsff(repackagedIn) : null;
  },
  repackaging: async ({ id }) => {
    const repackaging = await prisma.bsff
      .findUnique({ where: { id } })
      .repackaging();
    return repackaging.map(bsff => ({
      id: bsff.id,
      // ficheInterventions will be resolved in InitialBsff resolver
      ficheInterventions: []
    }));
  },
  grouping: async ({ id }) => {
    const bsffSplits = await getGroupingBsffsSplits(id);
    return bsffSplits.map(({ bsff, weight }) => ({
      bsff: {
        id: bsff.id,
        // ficheInterventions will be resolved in InitialBsff resolver
        ficheInterventions: []
      },
      weight
    }));
  },
  groupedIn: async ({ id }) => {
    const bsffSplits = await getGroupedInBsffsSplits(id);
    return bsffSplits.map(({ bsff, weight }) => ({
      bsff: unflattenBsff(bsff),
      weight
    }));
  }
};
