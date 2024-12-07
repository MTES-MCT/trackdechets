import { BsdasriResolvers } from "@td/codegen-back";

import grouping from "./bsdasris/grouping";
import groupedIn from "./bsdasris/groupedIn";
import synthesizedIn from "./bsdasris/synthesizedIn";
import synthesizing from "./bsdasris/synthesizing";

const bsdasriResolvers: BsdasriResolvers = {
  grouping,
  groupedIn,
  synthesizing,
  synthesizedIn,
  metadata: bsdasri => {
    return {
      id: bsdasri.id
    } as any;
  }
};

export default bsdasriResolvers;
