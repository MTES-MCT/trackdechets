import { getBsdaFromActivityEvents } from "../../activity-events/bsda";
import {
  BsdaRevisionRequest,
  BsdaRevisionRequestResolvers
} from "../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  expandBsdaRevisionRequestContent,
  expandBsdaFromDb
} from "../converter";
import { BsdaWithTransporters } from "../types";

const bsdaRevisionRequestResolvers: BsdaRevisionRequestResolvers = {
  approvals: async parent => {
    const approvals = await prisma.bsdaRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .approvals();
    return approvals ?? [];
  },
  content: parent => {
    return expandBsdaRevisionRequestContent(parent as any);
  },
  authoringCompany: async parent => {
    const authoringCompany = await prisma.bsdaRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .authoringCompany();

    if (!authoringCompany) {
      throw new Error(
        `BsdaRevisionRequest ${parent.id} has no authoring company.`
      );
    }
    return authoringCompany;
  },
  bsda: async (
    parent: BsdaRevisionRequest & { bsdaId: string },
    _,
    { dataloaders }
  ) => {
    const actualBsda = await prisma.bsdaRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .bsda({ include: { transporters: true } });
    const bsdaFromEvents = await getBsdaFromActivityEvents(
      { bsdaId: parent.bsdaId, at: parent.createdAt },
      { dataloader: dataloaders.events }
    );
    return expandBsdaFromDb({
      ...actualBsda,
      ...bsdaFromEvents
    } as BsdaWithTransporters);
  }
};

export default bsdaRevisionRequestResolvers;
