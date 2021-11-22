import { AcceptationStatus } from ".prisma/client";
import { BsddReviewResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";
import { expandFormFromDb } from "../form-converter";

const bsddReviewResolvers: BsddReviewResolvers = {
  validations: async parent => {
    const review = await prisma.bsddReview.findUnique({
      where: { id: parent.id },
      include: { validations: { include: { company: true } } }
    });
    return review.validations;
  },
  status: async parent => {
    const validations = await prisma.bsddReview
      .findUnique({ where: { id: parent.id } })
      .validations();

    if (validations.every(val => val.status === AcceptationStatus.ACCEPTED)) {
      return AcceptationStatus.ACCEPTED;
    }
    if (validations.every(val => val.status === AcceptationStatus.REFUSED)) {
      return AcceptationStatus.REFUSED;
    }
    return AcceptationStatus.PENDING;
  },
  content: parent => {
    return expandFormFromDb(parent.content as any) as any;
  },
  requestedBy: parent => {
    return prisma.bsddReview
      .findUnique({ where: { id: parent.id } })
      .requestedBy();
  },
  bsdd: parent => {
    return prisma.form.findUnique({ where: { id: parent.bsddId } });
  }
};

export default bsddReviewResolvers;
