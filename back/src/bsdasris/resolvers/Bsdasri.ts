import { BsdasriResolvers } from "../../generated/graphql/types";

import grouping from "./bsdasris/grouping";

const bsdasriResolvers: BsdasriResolvers = {
  grouping,
  metadata: bsdasri => {
    return {
      id: bsdasri.id
    } as any;
  }
};

export default bsdasriResolvers;
