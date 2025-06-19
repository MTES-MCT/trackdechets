import type { BsdasriResolvers } from "@td/codegen-back";

import grouping from "./bsdasris/grouping";
import groupedIn from "./bsdasris/groupedIn";
import synthesizedIn from "./bsdasris/synthesizedIn";
import synthesizing from "./bsdasris/synthesizing";
import { getReadonlyBsdasriRepository } from "../repository";

const bsdasriResolvers: BsdasriResolvers = {
  grouping,
  groupedIn,
  synthesizing,
  synthesizedIn,
  intermediaries: async bsdasri => {
    const intermediaries = await getReadonlyBsdasriRepository()
      .findRelatedEntity({ id: bsdasri.id })
      .intermediaries();

    return intermediaries ?? null;
  },
  metadata: bsdasri => {
    return {
      id: bsdasri.id
    } as any;
  }
};

export default bsdasriResolvers;
