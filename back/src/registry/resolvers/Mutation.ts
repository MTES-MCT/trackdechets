import { MutationResolvers } from "../../generated/graphql/types";
import { addToSsdRegistry } from "./mutations/addToSsdRegistry";
import { importFile } from "./mutations/importFile";
import { generateWastesRegistryExport } from "./mutations/generateWastesRegistryExport";
export const Mutation: MutationResolvers = {
  importFile: importFile as any,
  addToSsdRegistry,
  generateWastesRegistryExport: generateWastesRegistryExport as any
};
