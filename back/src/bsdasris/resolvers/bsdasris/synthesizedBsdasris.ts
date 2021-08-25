import { BsdasriResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";

const synthesizedBsdasris: BsdasriResolvers["synthesizedBsdasris"] = async bsdasri => {
  const synthesizedBsdasris = await prisma.bsdasri
    .findUnique({ where: { id: bsdasri.id } })
    .synthesizedBsdasris();
  return synthesizedBsdasris.map(bsdasri => bsdasri.id);
};

export default synthesizedBsdasris;
