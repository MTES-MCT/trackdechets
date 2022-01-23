import { BsdasriResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";

import { expandBsdasriFromDb } from "../../converter";

const groupedIn: BsdasriResolvers["groupedIn"] = async bsdasri => {
  const groupedIn = await prisma.bsdasri
    .findUnique({ where: { id: bsdasri.id } })
    .groupedIn();
  if (!groupedIn) {
    return null;
  }
  return expandBsdasriFromDb(groupedIn);
};

export default groupedIn;
