import { RevisionRequestAcceptationStatus } from "@prisma/client";
import { BsddRevisionRequestResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";
import { expandFormFromDb } from "../form-converter";

const bsddRevisionRequestResolvers: BsddRevisionRequestResolvers = {
  validations: async parent => {
    const review = await prisma.bsddRevisionRequest.findUnique({
      where: { id: parent.id },
      include: { validations: { include: { company: true } } }
    });
    return review.validations;
  },
  status: async parent => {
    const validations = await prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .validations();

    if (
      validations.every(
        val => val.status === RevisionRequestAcceptationStatus.ACCEPTED
      )
    ) {
      return RevisionRequestAcceptationStatus.ACCEPTED;
    }
    if (
      validations.some(
        val => val.status === RevisionRequestAcceptationStatus.REFUSED
      )
    ) {
      return RevisionRequestAcceptationStatus.REFUSED;
    }
    return RevisionRequestAcceptationStatus.PENDING;
  },
  content: parent => {
    return expandFormFromDb(parent.content as any) as any;
  },
  requestedBy: parent => {
    return prisma.bsddRevisionRequest
      .findUnique({ where: { id: parent.id } })
      .requestedBy();
  },
  bsdd: parent => {
    return prisma.form.findUnique({ where: { id: parent.bsddId } });
  }
};

export default bsddRevisionRequestResolvers;
