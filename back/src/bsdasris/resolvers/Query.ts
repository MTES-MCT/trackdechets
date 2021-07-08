import bsdasris from "./queries/bsdasris";
import bsdasri from "./queries/bsdasri";
import bsdasriPdf from "./queries/bsdasriPdf";
import { QueryResolvers } from "../../generated/graphql/types";
const Query: QueryResolvers = {
  bsdasris,
  bsdasri,
  bsdasriPdf
};

export default Query;
