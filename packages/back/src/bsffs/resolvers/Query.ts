import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";
import bsff from "./queries/bsff";
import bsffPdf from "./queries/bsffPdf";
import bsffs from "./queries/bsffs";

export const Query: QueryResolvers = {
  bsff,
  bsffPdf,
  bsffs
};
