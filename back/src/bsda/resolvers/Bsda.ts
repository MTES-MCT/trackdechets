import { BsdaResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";
import { expandBsdaFromDb, toInitialBsda } from "../converter";

export const Bsda: BsdaResolvers = {
  forwardedIn: async ({ id }) => {
    const forwardingBsda = await prisma.bsda
      .findUnique({
        where: { id }
      })
      .forwardedIn();
    return forwardingBsda ? expandBsdaFromDb(forwardingBsda) : null;
  },
  forwarding: async ({ id }) => {
    const forwardedBsda = await prisma.bsda
      .findUnique({
        where: { id }
      })
      .forwarding();
    return forwardedBsda
      ? toInitialBsda(expandBsdaFromDb(forwardedBsda))
      : null;
  },
  grouping: async ({ id }) => {
    const grouping = await prisma.bsda.findUnique({ where: { id } }).grouping();
    return grouping.map(bsda => toInitialBsda(expandBsdaFromDb(bsda)));
  },
  groupedIn: async ({ id }) => {
    const groupedIn = await prisma.bsda
      .findUnique({ where: { id } })
      .groupedIn();
    return toInitialBsda(expandBsdaFromDb(groupedIn));
  },
  metadata: bsda => {
    return {
      id: bsda.id,
      status: bsda.status
    } as any;
  }
};
