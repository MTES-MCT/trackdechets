import { BsdasriResolvers } from "../../generated/graphql/types";

import regroupedBsdasris from "./bsdasris/regroupedBsdasris";
import synthesizedBsdasris from "./bsdasris/synthesizedBsdasris";

const bsdasriResolvers: BsdasriResolvers = {
  regroupedBsdasris,
  synthesizedBsdasris,
  metadata: bsdasri => {
    return {
      id: bsdasri.id
    } as any;
  }
};

export default bsdasriResolvers;
