import { BsdaResolvers } from "../../generated/graphql/types";
import { expandBsdaFromDb, toInitialBsda } from "../converter";
import { getReadonlyBsdaRepository } from "../repository";

export const Bsda: BsdaResolvers = {
  forwardedIn: async ({ id }) => {
    const forwardingBsda = await getReadonlyBsdaRepository()
      .findRelatedEntity({ id })
      .forwardedIn();
    return forwardingBsda ? expandBsdaFromDb(forwardingBsda) : null;
  },
  forwarding: async ({ id }) => {
    const forwardedBsda = await getReadonlyBsdaRepository()
      .findRelatedEntity({ id })
      .forwarding();
    return forwardedBsda
      ? toInitialBsda(expandBsdaFromDb(forwardedBsda))
      : null;
  },
  grouping: async ({ id }) => {
    const grouping = await getReadonlyBsdaRepository()
      .findRelatedEntity({ id })
      .grouping();
    return grouping.map(bsda => toInitialBsda(expandBsdaFromDb(bsda)));
  },
  groupedIn: async ({ id }) => {
    const groupedIn = await getReadonlyBsdaRepository()
      .findRelatedEntity({ id })
      .groupedIn();
    return groupedIn ? expandBsdaFromDb(groupedIn) : null;
  },
  metadata: bsda => {
    return {
      id: bsda.id,
      status: bsda.status
    } as any;
  }
};
