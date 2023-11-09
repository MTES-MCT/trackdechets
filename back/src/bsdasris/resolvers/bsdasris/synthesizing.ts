import { BsdasriResolvers } from "../../../generated/graphql/types";

import { Bsdasri, BsdasriType } from "@prisma/client";
import { expandSynthesizingDasri } from "../../converter";
import { isSessionUser } from "../../../auth";
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
  let synthesizing: Bsdasri[] = [];
  // use ES indexed field when requested from dashboard
  if (isGetBsdsQuery(ctx) && isSessionUser(ctx)) {
    synthesizing = (bsdasri?.synthesizing as any) ?? [];
  }

  synthesizing =
    (await getReadonlyBsdasriRepository()
      .findRelatedEntity({ id: bsdasri.id })
      .synthesizing()) ?? [];

  return synthesizing.map(bsdasri => expandSynthesizingDasri(bsdasri));
};

export default synthesizing;
