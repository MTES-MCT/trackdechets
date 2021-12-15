import { BsddRevisionRequestResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";
import { expandBsddRevisionRequestContent } from "../form-converter";

const bsddRevisionRequestResolvers: BsddRevisionRequestResolvers = {
  approvals: async parent => {
    return prisma.bsddRevisionRequestApproval.findMany({
      where: { revisionRequestId: parent.id }
    });
  },
  content: parent => {
    return expandBsddRevisionRequestContent(parent as any);
  },
  authoringCompany: parent => {
    return prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .authoringCompany();
  },
  bsdd: parent => {
    return prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .bsdd();
  }
};

export default bsddRevisionRequestResolvers;
