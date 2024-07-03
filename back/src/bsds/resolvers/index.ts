import { QueryResolvers } from "../../generated/graphql/types";
import bsds from "./queries/bsds";
import { findBsdResolver } from "./queries/findBsd";
import { Mutation } from "./Mutation";

const Query: QueryResolvers = {
  bsds,
  findBsd: findBsdResolver
};

export default { Query, Mutation };
