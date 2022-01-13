import { FormRevisionRequestResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";
import {
  expandBsddRevisionRequestContent,
  expandFormFromDb
} from "../form-converter";

const formRevisionRequestResolvers: FormRevisionRequestResolvers = {
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
  form: async parent => {
    const bsdd = await prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .bsdd();
    return expandFormFromDb(bsdd);
  }
};

export default formRevisionRequestResolvers;
