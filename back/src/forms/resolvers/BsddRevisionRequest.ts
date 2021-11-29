import { Form, TemporaryStorageDetail } from "@prisma/client";
import { BsddRevisionRequestResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";
import {
  expandFormFromDb,
  expandTemporaryStorageFromDb
} from "../form-converter";

const bsddRevisionRequestResolvers: BsddRevisionRequestResolvers = {
  approvals: async parent => {
    return prisma.bsddRevisionRequestApproval.findMany({
      where: { revisionRequestId: parent.id }
    });
  },
  content: parent => {
    const { temporaryStorageDetail, ...bsdd } = parent.content;

    return {
      ...expandFormFromDb(bsdd as Form),
      ...(temporaryStorageDetail && {
        temporaryStorageDetail: expandTemporaryStorageFromDb(
          temporaryStorageDetail as TemporaryStorageDetail
        )
      })
    } as any; // Typing as any because of differences in __typename props;
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
