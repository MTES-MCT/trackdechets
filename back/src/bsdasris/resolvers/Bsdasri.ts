import { BsdasriResolvers } from "../../generated/graphql/types";

import grouping from "./bsdasris/grouping";
import groupedIn from "./bsdasris/groupedIn";

const bsdasriResolvers: BsdasriResolvers = {
  grouping,
  groupedIn,
  metadata: bsdasri => {
    return {
      id: bsdasri.id
    } as any;
  }
};

export default bsdasriResolvers;
