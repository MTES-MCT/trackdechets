import bspaoh from "./queries/bspaoh";
import bspaohs from "./queries/bspaohs";
import bspaohPdf from "./queries/bspaohPdf";
import { QueryResolvers } from "../../generated/graphql/types";

const Query: QueryResolvers = {
  bspaoh,
  bspaohs,
  bspaohPdf
};

export default Query;
