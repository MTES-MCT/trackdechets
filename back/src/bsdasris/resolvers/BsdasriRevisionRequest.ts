import {
  BsdasriRevisionRequest,
  BsdasriRevisionRequestResolvers
} from "../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  expandBsdasriRevisionRequestContent,
  expandBsdasriFromDB
} from "../converter";
import { FullDbBsdasri } from "../types";

const bsdasriRevisionRequestResolvers: BsdasriRevisionRequestResolvers = {
  approvals: async parent => {
    const approvals = await prisma.bsdasriRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .approvals();
    return approvals ?? [];
  },
  content: parent => {
    return expandBsdasriRevisionRequestContent(parent as any);
  },
  authoringCompany: async parent => {
    const authoringCompany = await prisma.bsdasriRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .authoringCompany();

    if (!authoringCompany) {
      throw new Error(
        `BsdasriRevisionRequest ${parent.id} has no authoring company.`
      );
    }
    return authoringCompany;
  },
  bsdasri: async (
    parent: BsdasriRevisionRequest & { bsdasriSnapshot: FullDbBsdasri }
  ) => {
    return expandBsdasriFromDB(parent.bsdasriSnapshot);
  }
};

export default bsdasriRevisionRequestResolvers;
