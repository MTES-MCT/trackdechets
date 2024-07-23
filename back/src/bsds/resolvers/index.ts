import { QueryResolvers } from "../../generated/graphql/types";
import bsds from "./queries/bsds";
import { bsdResolver } from "./queries/bsd";
import { Mutation } from "./Mutation";

const Query: QueryResolvers = {
  bsds,
  bsd: bsdResolver
};

export default { Query, Mutation };
