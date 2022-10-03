import { MutationResolvers } from "../../generated/graphql/types";
import createPdfAccessTokenResolver from "./mutations/createPdfAccessToken";
import reindexBsd from "./mutations/reindexBsd";
export const Mutation: MutationResolvers = {
  createPdfAccessToken: createPdfAccessTokenResolver,
  reindexBsd: reindexBsd
};
