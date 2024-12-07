import { BsffPackagingResolvers } from "@td/codegen-back";
import { expandBsffFromDB } from "../converter";
import {
  getReadonlyBsffPackagingRepository,
  getReadonlyBsffRepository
} from "../repository";
import { BsffWithTransportersInclude } from "../types";

export const BsffPackaging: BsffPackagingResolvers = {
  bsff: async packaging => {
    const { findUniqueGetBsff } = getReadonlyBsffPackagingRepository();
    const bsff = await findUniqueGetBsff({ where: { id: packaging.id } });

    return {
      ...expandBsffFromDB(bsff!),
      ficheInterventions: [],
      packagings: [],
      forwarding: [],
      repackaging: [],
      grouping: []
    };
  },
  nextBsff: async packaging => {
    const { findUniqueGetNextPackaging } = getReadonlyBsffPackagingRepository();
    const nextPackaging = await findUniqueGetNextPackaging({
      where: { id: packaging.id }
    });
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
    const { findNextPackagings } = getReadonlyBsffPackagingRepository();
    const { findMany: findManyBsff } = getReadonlyBsffRepository();
    const nextPackagings = await findNextPackagings(packaging.id);
    const nextBsffIds = nextPackagings.map(p => p.bsffId);
    const bsffs = await findManyBsff({
      where: { id: { in: nextPackagings.map(p => p.bsffId) } },
      include: BsffWithTransportersInclude
    });
    return nextBsffIds
      .map(id => bsffs.find(bsff => bsff.id === id))
      .filter(v => !!v)
      .map(bsff => ({
        ...expandBsffFromDB(bsff!),
        ficheInterventions: [],
        packagings: [],
        forwarding: [],
        repackaging: [],
        grouping: []
      }));
  },
  previousBsffs: async packaging => {
    const { findPreviousPackagings } = getReadonlyBsffPackagingRepository();
    const { findMany: findManyBsff } = getReadonlyBsffRepository();
    const previousPackagings = await findPreviousPackagings([packaging.id]);
    const previousBsffIds = [...new Set(previousPackagings.map(p => p.bsffId))];
    const bsffs = await findManyBsff({
      where: { id: { in: previousBsffIds } },
      include: BsffWithTransportersInclude
    });
    return previousBsffIds
      .map(id => bsffs.find(bsff => bsff.id === id))
      .filter(v => !!v)
      .map(bsff => {
        const gqlBsff = expandBsffFromDB(bsff!);
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
