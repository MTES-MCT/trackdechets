import { BsdasriResolvers } from "@td/codegen-back";

import { BsdasriType } from "@prisma/client";
import { expandGroupingDasri } from "../../converter";
import { isSessionUser } from "../../../auth";
import { getReadonlyBsdasriRepository } from "../../repository";
import { isGetBsdsQuery } from "../../../bsds/resolvers/queries/bsds";

const grouping: BsdasriResolvers["grouping"] = async (bsdasri, _, ctx) => {
  if (bsdasri.type !== BsdasriType.GROUPING) {
    // skip db query
    return [];
  }

  // use ES indexed field when requested from dashboard
  if (isGetBsdsQuery(ctx) && isSessionUser(ctx)) {
    return bsdasri?.grouping ?? [];
  }
  const grouping =
    (await getReadonlyBsdasriRepository()
      .findRelatedEntity({ id: bsdasri.id })
      .grouping()) ?? [];

  return grouping.map(bsdasri => expandGroupingDasri(bsdasri));
};

export default grouping;
