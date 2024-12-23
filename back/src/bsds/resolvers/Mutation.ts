import { MutationResolvers } from "../../generated/graphql/types";
import cloneBsdResolver from "./mutations/clone";
import createPdfAccessTokenResolver from "./mutations/createPdfAccessToken";
import reindexBsds from "./mutations/reindexBsds";

export const Mutation: MutationResolvers = {
  createPdfAccessToken: createPdfAccessTokenResolver,
  reindexBsds: reindexBsds,
  ...(process.env.ALLOW_CLONING_BSDS === "true"
    ? { cloneBsd: cloneBsdResolver }
    : {})
};
