import type { BsdaResolvers } from "@td/codegen-back";
import { expandBsdaFromDb, toInitialBsda } from "../converter";
import { getReadonlyBsdaRepository } from "../repository";
import { isSessionUser } from "../../auth/auth";
import { isGetBsdsQuery } from "../../bsds/resolvers/queries/bsds";

export const Bsda: BsdaResolvers = {
  forwardedIn: async (bsda, _, ctx) => {
    // use ES indexed field when requested from dashboard
    if (isGetBsdsQuery(ctx) && isSessionUser(ctx)) {
      return !!bsda?.forwardedIn ? bsda?.forwardedIn : null;
    }
    const forwardingBsda = await getReadonlyBsdaRepository()
      .findRelatedEntity({ id: bsda.id })
      .forwardedIn({ include: { transporters: true } });

    return forwardingBsda ? expandBsdaFromDb(forwardingBsda) : null;
  },
  forwarding: async ({ id }) => {
    const forwardedBsda = await getReadonlyBsdaRepository()
      .findRelatedEntity({ id })
      .forwarding({ include: { transporters: true } });
    return forwardedBsda
      ? toInitialBsda(expandBsdaFromDb(forwardedBsda))
      : null;
  },
  grouping: async ({ id }) => {
    const grouping = await getReadonlyBsdaRepository()
      .findRelatedEntity({ id })
      .grouping({ include: { transporters: true } });
    return grouping?.map(bsda => toInitialBsda(expandBsdaFromDb(bsda))) ?? [];
  },
  groupedIn: async (bsda, _, ctx) => {
    // use ES indexed field when requested from dashboard
    if (isGetBsdsQuery(ctx) && isSessionUser(ctx)) {
      return !!bsda?.groupedIn ? bsda?.groupedIn : null;
    }
    const groupedIn = await getReadonlyBsdaRepository()
      .findRelatedEntity({ id: bsda.id })
      .groupedIn({ include: { transporters: true } });
    return groupedIn ? expandBsdaFromDb(groupedIn) : null;
  },
  intermediaries: async bsda => {
    const intermediaries = await getReadonlyBsdaRepository()
      .findRelatedEntity({ id: bsda.id })
      .intermediaries();

    return intermediaries ?? null;
  },
  metadata: bsda => {
    return {
      ...bsda.metadata,
      id: bsda.id
    } as any;
  }
};
