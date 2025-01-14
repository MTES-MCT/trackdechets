import type { MutationResolvers } from "@td/codegen-back";
import { addToSsdRegistry } from "./mutations/addToSsdRegistry";
import { addToIncomingWasteRegistry } from "./mutations/addToIncomingWasteRegistry";
import { addToIncomingTexsRegistry } from "./mutations/addToIncomingTexsRegistry";
import { importFile } from "./mutations/importFile";
import { generateRegistryV2Export } from "./mutations/generateRegistryV2Export";
export const Mutation: MutationResolvers = {
  importFile: importFile as any,
  addToSsdRegistry,
  addToIncomingWasteRegistry,
  addToIncomingTexsRegistry,
  generateRegistryV2Export: generateRegistryV2Export as any
};
