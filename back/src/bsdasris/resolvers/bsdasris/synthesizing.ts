import { BsdasriResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { BsdasriType } from "@prisma/client";
import { unflattenSynthesizingDasri } from "../../converter";

const synthesizing: BsdasriResolvers["synthesizing"] = async bsdasri => {
  if (bsdasri.type !== BsdasriType.SYNTHESIS) {
    // skip db query
    return [];
  }
  const synthesizing = await prisma.bsdasri
    .findUnique({ where: { id: bsdasri.id } })
    .synthesizing();

  return synthesizing.map(bsdasri => unflattenSynthesizingDasri(bsdasri));
};

export default synthesizing;
