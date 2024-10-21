import { QueryResolvers } from "../../generated/graphql/types";
import bsds from "./queries/bsds";
import { bsdResolver } from "./queries/bsd";
import { Mutation } from "./Mutation";
import controlBsdsResolver from "./queries/controlBsds";

const Query: QueryResolvers = {
  bsds,
  bsd: bsdResolver,
  controlBsds: controlBsdsResolver
};

export default { Query, Mutation };
