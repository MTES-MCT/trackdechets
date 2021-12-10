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
  author: parent => {
    return prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .author();
  },
  bsdd: parent => {
    return prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .bsdd();
  }
};

export default bsddRevisionRequestResolvers;
