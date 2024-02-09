import { MutationResolvers } from "../../generated/graphql/types";
import createPdfAccessTokenResolver from "./mutations/createPdfAccessToken";
import reindexBsds from "./mutations/reindexBsds";
export const Mutation: MutationResolvers = {
  createPdfAccessToken: createPdfAccessTokenResolver,
  reindexBsds: reindexBsds
};
