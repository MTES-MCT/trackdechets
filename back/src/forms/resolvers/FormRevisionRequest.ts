import { getBsddFromActivityEvents } from "../../activity-events/bsdd";
import {
  FormRevisionRequest,
  FormRevisionRequestResolvers
} from "../../generated/graphql/types";
import prisma from "../../prisma";
import {
  expandBsddRevisionRequestContent,
  expandFormFromDb
} from "../form-converter";

const formRevisionRequestResolvers: FormRevisionRequestResolvers = {
  approvals: async parent => {
    return prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .approvals();
  },
  content: parent => {
    return expandBsddRevisionRequestContent(parent as any);
  },
  authoringCompany: parent => {
    return prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .authoringCompany();
  },
  form: async (parent: FormRevisionRequest & { bsddId: string }) => {
    const bsdd = await getBsddFromActivityEvents(
      parent.bsddId,
      parent.createdAt
    );
    console.log(bsdd);
    return expandFormFromDb(bsdd);
  }
};

export default formRevisionRequestResolvers;
