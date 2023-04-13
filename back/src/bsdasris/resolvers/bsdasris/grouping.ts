import { BsdasriResolvers } from "../../../generated/graphql/types";

import { BsdasriType } from "@prisma/client";
import { expandGroupingDasri } from "../../converter";
import { dashboardOperationName } from "../../../common/queries";
import { isSessionUser } from "../../../auth";
import { getReadonlyBsdasriRepository } from "../../repository";

const grouping: BsdasriResolvers["grouping"] = async (bsdasri, _, ctx) => {
  if (bsdasri.type !== BsdasriType.GROUPING) {
    // skip db query
    return [];
  }

  // use ES indexed field when requested from dashboard
  if (
    ctx?.req?.body?.operationName === dashboardOperationName &&
    isSessionUser(ctx)
  ) {
    return bsdasri?.grouping ?? [];
  }
  const grouping =
    (await getReadonlyBsdasriRepository()
      .findRelatedEntity({ id: bsdasri.id })
      .grouping()) ?? [];

  return grouping.map(bsdasri => expandGroupingDasri(bsdasri));
};

export default grouping;
