import { BsdasriResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";

import { expandBsdasriFromDB } from "../../converter";

const groupedIn: BsdasriResolvers["groupedIn"] = async bsdasri => {
  const groupedIn = await prisma.bsdasri
    .findUnique({ where: { id: bsdasri.id } })
    .groupedIn();
  if (!groupedIn) {
    return null;
  }
  return expandBsdasriFromDB(groupedIn);
};

export default groupedIn;
