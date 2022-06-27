import { QueryResolvers } from "../../generated/graphql/types";
import bsds from "./queries/bsds";
import { Mutation } from "./Mutation";
const Query: QueryResolvers = {
  bsds
};

export default { Query, Mutation };
