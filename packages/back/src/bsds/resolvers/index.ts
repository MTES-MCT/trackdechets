import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";
import bsds from "./queries/bsds";

const Query: QueryResolvers = {
  bsds
};

export default { Query };
