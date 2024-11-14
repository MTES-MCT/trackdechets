import { MutationResolvers } from "../../generated/graphql/types";
import { addToSsdRegistry } from "./mutations/addToSsdRegistry";
import { importFile } from "./mutations/importFile";

export const Mutation: MutationResolvers = {
  importFile: importFile as any,
  addToSsdRegistry
};
