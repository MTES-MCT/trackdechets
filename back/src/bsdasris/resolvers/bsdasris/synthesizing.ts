import { BsdasriResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { BsdasriType } from "@prisma/client";
import { expandSynthesizingDasri } from "../../converter";
import { dashboardOperationName } from "../../../common/queries";
import { isSessionUser } from "../../../auth";

const synthesizing: BsdasriResolvers["synthesizing"] = async (
  bsdasri,
  _,
  ctx
) => {
  if (bsdasri.type !== BsdasriType.SYNTHESIS) {
    // skip db query
    return [];
  }
  let synthesizing = [];
  // use ES indexed field when requested from dashboard
  if (
    ctx?.req?.body?.operationName === dashboardOperationName &&
    isSessionUser(ctx)
  ) {
    synthesizing = bsdasri?.synthesizing ?? [];
  } else {
    synthesizing = await prisma.bsdasri
      .findUnique({ where: { id: bsdasri.id } })
      .synthesizing();
  }

  return synthesizing.map(bsdasri => expandSynthesizingDasri(bsdasri));
};

export default synthesizing;
