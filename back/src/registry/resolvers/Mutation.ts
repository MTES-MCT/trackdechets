import { MutationResolvers } from "../../generated/graphql/types";
import { importFile } from "./mutations/importFile";

export const Mutation: MutationResolvers = {
  importFile
};
