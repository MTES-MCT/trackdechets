import { BsdasriResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { BsdasriType } from "@prisma/client";
import { expandGroupingDasri } from "../../converter";

const grouping: BsdasriResolvers["grouping"] = async bsdasri => {
  if (bsdasri.type !== BsdasriType.GROUPING) {
    // skip db query
    return [];
  }
  const grouping = await prisma.bsdasri
    .findUnique({ where: { id: bsdasri.id } })
    .grouping();

  return grouping.map(bsdasri => expandGroupingDasri(bsdasri));
};

export default grouping;
