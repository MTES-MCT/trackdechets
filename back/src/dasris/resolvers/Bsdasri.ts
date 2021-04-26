import { BsdasriResolvers } from "../../generated/graphql/types";

import regroupedBsdasris from "./bsdasris/regroupedBsdasris";

const bsdasriResolvers: BsdasriResolvers = {
  regroupedBsdasris,
  metadata: bsdasri => {
    return {
      id: bsdasri.id
    } as any;
  }
};

export default bsdasriResolvers;
