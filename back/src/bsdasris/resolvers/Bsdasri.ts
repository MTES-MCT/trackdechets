import { BsdasriResolvers } from "../../generated/graphql/types";
import { unflattenBsdasri } from "../converter";
import grouping from "./bsdasris/grouping";
import prisma from "../../prisma";
const bsdasriResolvers: BsdasriResolvers = {
  grouping,
  groupedIn: async ({ id }) => {
    const groupedIn = await prisma.bsdasri
      .findUnique({ where: { id } })
      .groupedIn();
    return unflattenBsdasri(groupedIn);
  },
  metadata: bsdasri => {
    return {
      id: bsdasri.id
    } as any;
  }
};

export default bsdasriResolvers;
