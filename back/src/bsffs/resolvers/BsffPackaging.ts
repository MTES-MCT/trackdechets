import prisma from "../../prisma";
import { BsffPackagingResolvers } from "../../generated/graphql/types";
import { getNextPackagings, getPreviousPackagings } from "../database";
import { expandBsffFromDB } from "../converter";

export const BsffPackaging: BsffPackagingResolvers = {
  bsff: async packaging => {
    const bsff = await prisma.bsffPackaging
      .findUnique({ where: { id: packaging.id } })
      .bsff();
    return {
      ...expandBsffFromDB(bsff),
      ficheInterventions: [],
      packagings: [],
      forwarding: [],
      repackaging: [],
      grouping: []
    };
  },
  nextBsff: async packaging => {
    const nextPackaging = await prisma.bsffPackaging
      .findUnique({ where: { id: packaging.id } })
      .nextPackaging({ include: { bsff: true } });
    if (nextPackaging) {
      return {
        ...expandBsffFromDB(nextPackaging.bsff),
        ficheInterventions: [],
        packagings: [],
        forwarding: [],
        repackaging: [],
        grouping: []
      };
    }
    return null;
  },
  nextBsffs: async packaging => {
    const nextPackagings = await getNextPackagings(packaging.id);
    const nextBsffIds = nextPackagings.map(p => p.bsffId);
    const bsffs = await prisma.bsff.findMany({
      where: { id: { in: nextPackagings.map(p => p.bsffId) } }
    });
    return nextBsffIds
      .map(id => bsffs.find(bsff => bsff.id === id))
      .filter(v => !!v)
      .map(bsff => ({
        ...expandBsffFromDB(bsff),
        ficheInterventions: [],
        packagings: [],
        forwarding: [],
        repackaging: [],
        grouping: []
      }));
  },
  previousBsffs: async packaging => {
    const previousPackagings = await getPreviousPackagings([packaging.id]);
    const previousBsffIds = [...new Set(previousPackagings.map(p => p.bsffId))];
    const bsffs = await prisma.bsff.findMany({
      where: { id: { in: previousBsffIds } }
    });
    return previousBsffIds
      .map(id => bsffs.find(bsff => bsff.id === id))
      .filter(v => !!v)
      .map(bsff => {
        const gqlBsff = expandBsffFromDB(bsff);
        return {
          id: gqlBsff.id,
          type: gqlBsff.type,
          emitter: gqlBsff.emitter,
          destination: gqlBsff.destination,
          waste: gqlBsff.waste,
          weight: gqlBsff.weight,
          ficheInterventions: [],
          packagings: []
        };
      });
  }
};
