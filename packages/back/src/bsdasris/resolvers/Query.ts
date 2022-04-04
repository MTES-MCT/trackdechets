import bsdasris from "./queries/bsdasris";
import bsdasri from "./queries/bsdasri";
import bsdasriPdf from "./queries/bsdasriPdf";
import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";
const Query: QueryResolvers = {
  bsdasris,
  bsdasri,
  bsdasriPdf
};

export default Query;
