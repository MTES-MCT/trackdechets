import bsdasris from "./queries/bsdasris";
import bsdasri from "./queries/bsdasri";
import bsdasriPdf from "./queries/bsdasriPdf";
import type { QueryResolvers } from "@td/codegen-back";
import { bsdasriRevisionRequests } from "./queries/revisionRequests";

const Query: QueryResolvers = {
  bsdasris,
  bsdasri,
  bsdasriPdf,
  bsdasriRevisionRequests
};

export default Query;
