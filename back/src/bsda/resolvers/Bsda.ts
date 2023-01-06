import { BsdaResolvers } from "../../generated/graphql/types";
import { expandBsdaFromDb, toInitialBsda } from "../converter";
import { getReadonlyBsdaRepository } from "../repository";
import { dashboardOperationName } from "../../common/queries";
import { isSessionUser } from "../../auth";

export const Bsda: BsdaResolvers = {
  forwardedIn: async (bsda, _, ctx) => {
    // use ES indexed field when requested from dashboard
    if (
      ctx?.req?.body?.operationName === dashboardOperationName &&
      isSessionUser(ctx)
    ) {
      return !!bsda?.forwardedIn ? bsda?.forwardedIn : null;
    }
    const forwardingBsda = await getReadonlyBsdaRepository()
      .findRelatedEntity({ id: bsda.id })
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
  groupedIn: async (bsda, _, ctx) => {
    // use ES indexed field when requested from dashboard
    if (
      ctx?.req?.body?.operationName === dashboardOperationName &&
      isSessionUser(ctx)
    ) {
      return !!bsda?.groupedIn ? bsda?.groupedIn : null;
    }
    const groupedIn = await getReadonlyBsdaRepository()
      .findRelatedEntity({ id: bsda.id })
      .groupedIn();
    return groupedIn ? expandBsdaFromDb(groupedIn) : null;
  },
  intermediaries: async bsda => {
    const intermediaries = await getReadonlyBsdaRepository()
      .findRelatedEntity({ id: bsda.id })
      .intermediaries();

    if (intermediaries) {
      return intermediaries.map(intermediary => ({
        orgId: intermediary.siret,
        ...intermediary
      }));
    }
    return null;
  },
  metadata: bsda => {
    return {
      id: bsda.id,
      status: bsda.status
    } as any;
  }
};
