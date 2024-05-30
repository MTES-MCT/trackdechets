import bsdasris from "./queries/bsdasris";
import bsdasri from "./queries/bsdasri";
import bsdasriPdf from "./queries/bsdasriPdf";
import { QueryResolvers } from "../../generated/graphql/types";
import { bsdasriRevisionRequests } from "./queries/revisionRequests";

const Query: QueryResolvers = {
  bsdasris,
  bsdasri,
  bsdasriPdf,
  bsdasriRevisionRequests
};

export default Query;
