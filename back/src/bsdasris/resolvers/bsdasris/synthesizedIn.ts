import { BsdasriResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";

import { expandBsdasriFromDB } from "../../converter";

const synthesizedIn: BsdasriResolvers["synthesizedIn"] = async bsdasri => {
  const synthesizedIn = await prisma.bsdasri
    .findUnique({ where: { id: bsdasri.id } })
    .synthesizedIn();
  if (!synthesizedIn) {
    return null;
  }
  return expandBsdasriFromDB(synthesizedIn);
};

export default synthesizedIn;
