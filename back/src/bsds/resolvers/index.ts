import type { QueryResolvers } from "@td/codegen-back";
import bsds from "./queries/bsds";
import { bsdResolver } from "./queries/bsd";
import { Mutation } from "./Mutation";
import controlBsdsResolver from "./queries/controlBsds";
import bordereauxSearchResolver from "./queries/bordereauxSearch";

const Query: QueryResolvers = {
  bsds,
  bsd: bsdResolver,
  controlBsds: controlBsdsResolver,
  bordereauxSearch: bordereauxSearchResolver
};

export default { Query, Mutation };
