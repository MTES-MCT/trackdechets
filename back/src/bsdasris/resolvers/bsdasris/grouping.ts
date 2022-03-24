import { BsdasriResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { BsdasriType } from "@prisma/client";
import { unflattenGroupingDasri } from "../../converter";

const grouping: BsdasriResolvers["grouping"] = async bsdasri => {
  if (bsdasri.type !== BsdasriType.GROUPING) {
    // skip db query
    return [];
  }
  const grouping = await prisma.bsdasri
    .findUnique({ where: { id: bsdasri.id } })
    .grouping();

  return grouping.map(bsdasri => unflattenGroupingDasri(bsdasri));
};

export default grouping;
