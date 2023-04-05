import { getBsdaFromActivityEvents } from "../../activity-events/bsda";
import {
  BsdaRevisionRequest,
  BsdaRevisionRequestResolvers
} from "../../generated/graphql/types";
import prisma from "../../prisma";
import {
  expandBsdaRevisionRequestContent,
  expandBsdaFromDb
} from "../converter";

const bsdaRevisionRequestResolvers: BsdaRevisionRequestResolvers = {
  approvals: async parent => {
    return prisma.bsdaRevisionRequest
      .findUniqueOrThrow({ where: { id: parent.id } })
      .approvals();
  },
  content: parent => {
    return expandBsdaRevisionRequestContent(parent as any);
  },
  authoringCompany: parent => {
    return prisma.bsdaRevisionRequest
      .findUniqueOrThrow({ where: { id: parent.id } })
      .authoringCompany();
  },
  bsda: async (parent: BsdaRevisionRequest & { bsdaId: string }) => {
    const actualBsda = await prisma.bsdaRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .bsda();
    const bsdaFromEvents = await getBsdaFromActivityEvents(
      parent.bsdaId,
      parent.createdAt
    );
    return expandBsdaFromDb({ ...actualBsda, ...bsdaFromEvents });
  }
};

export default bsdaRevisionRequestResolvers;
