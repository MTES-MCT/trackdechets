import { BsdasriResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { BsdasriType } from "@prisma/client";
import { expandGroupingDasri } from "../../converter";
import { dashboardOperationName } from "../../../common/queries";
import { isSessionUser } from "../../../auth";

const grouping: BsdasriResolvers["grouping"] = async (bsdasri, _, ctx) => {
  if (bsdasri.type !== BsdasriType.GROUPING) {
    // skip db query
    return [];
  }
  let grouping = [];
  // use ES indexed field when requested from dashboard
  if (
    ctx?.req?.body?.operationName === dashboardOperationName &&
    isSessionUser(ctx)
  ) {
    grouping = bsdasri?.grouping ?? [];
  } else {
    grouping = await prisma.bsdasri
      .findUnique({ where: { id: bsdasri.id } })
      .grouping();
  }
  return grouping.map(bsdasri => expandGroupingDasri(bsdasri));
};

export default grouping;
