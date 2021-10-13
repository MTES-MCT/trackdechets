import { BsdasriResolvers } from "../../generated/graphql/types";
<<<<<<< HEAD

import grouping from "./bsdasris/grouping";

const bsdasriResolvers: BsdasriResolvers = {
  grouping,
=======
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
>>>>>>> origin/mod/dasri-harmo
  metadata: bsdasri => {
    return {
      id: bsdasri.id
    } as any;
  }
};

export default bsdasriResolvers;
