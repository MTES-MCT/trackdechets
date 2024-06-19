import {
  FormRevisionRequest,
  FormRevisionRequestResolvers
} from "../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  PrismaFormWithForwardedInAndTransporters,
  expandBsddRevisionRequestContent,
  expandFormFromDb
} from "../converter";

const formRevisionRequestResolvers: FormRevisionRequestResolvers = {
  approvals: async parent => {
    const approvals = await prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .approvals();

    return approvals ?? [];
  },
  content: parent => {
    return expandBsddRevisionRequestContent(parent as any);
  },
  authoringCompany: async parent => {
    const authoringCompany = await prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .authoringCompany();

    if (!authoringCompany) {
      throw new Error(
        `FormRevisionRequest ${parent.id} has no authoring company.`
      );
    }
    return authoringCompany;
  },
  form: async (
    parent: FormRevisionRequest & {
      bsddSnapshot: PrismaFormWithForwardedInAndTransporters;
    }
  ) => {
    return expandFormFromDb(parent.bsddSnapshot);
  }
};

export default formRevisionRequestResolvers;
