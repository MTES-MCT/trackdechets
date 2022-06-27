import { MutationResolvers } from "../../generated/graphql/types";
import createPdfAccessTokenResolver from "./mutations/createPdfAccessToken";
export const Mutation: MutationResolvers = {
  createPdfAccessToken: createPdfAccessTokenResolver
};
