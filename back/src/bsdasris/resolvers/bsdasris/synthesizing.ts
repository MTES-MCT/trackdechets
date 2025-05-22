import type { BsdasriResolvers } from "@td/codegen-back";

import { BsdasriType } from "@prisma/client";
import { expandSynthesizingDasri } from "../../converter";
import { isSessionUser } from "../../../auth/auth";
import { getReadonlyBsdasriRepository } from "../../repository";
import { isGetBsdsQuery } from "../../../bsds/resolvers/queries/bsds";

const synthesizing: BsdasriResolvers["synthesizing"] = async (
  bsdasri,
  _,
  ctx
) => {
  if (bsdasri.type !== BsdasriType.SYNTHESIS) {
    // skip db query
    return [];
  }
  // use ES indexed field when requested from dashboard
  if (isGetBsdsQuery(ctx) && isSessionUser(ctx)) {
    return bsdasri?.synthesizing ?? [];
  }

  const synthesizing =
    (await getReadonlyBsdasriRepository()
      .findRelatedEntity({ id: bsdasri.id })
      .synthesizing()) ?? [];

  return synthesizing.map(bsdasri => expandSynthesizingDasri(bsdasri));
};

export default synthesizing;
