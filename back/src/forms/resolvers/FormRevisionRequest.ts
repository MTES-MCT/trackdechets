import { getBsddFromActivityEvents } from "../../activity-events/bsdd";
import {
  FormRevisionRequest,
  FormRevisionRequestResolvers
} from "../../generated/graphql/types";
import prisma from "../../prisma";
import {
  expandBsddRevisionRequestContent,
  expandFormFromDb
} from "../converter";

const formRevisionRequestResolvers: FormRevisionRequestResolvers = {
  approvals: async parent => {
    return prisma.bsddRevisionRequest
      .findUniqueOrThrow({ where: { id: parent.id } })
      .approvals();
  },
  content: parent => {
    return expandBsddRevisionRequestContent(parent as any);
  },
  authoringCompany: parent => {
    return prisma.bsddRevisionRequest
      .findUniqueOrThrow({ where: { id: parent.id } })
      .authoringCompany();
  },
  form: async (parent: FormRevisionRequest & { bsddId: string }) => {
    const fullBsdd = await prisma.bsddRevisionRequest
      .findUniqueOrThrow({ where: { id: parent.id } })
      .bsdd({ include: { forwardedIn: true } });
    const bsdd = await getBsddFromActivityEvents(
      parent.bsddId,
      parent.createdAt
    );

    return expandFormFromDb({
      ...fullBsdd,
      ...bsdd,
      forwardedIn: fullBsdd.forwardedIn
    });
  }
};

export default formRevisionRequestResolvers;
