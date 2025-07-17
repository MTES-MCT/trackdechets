import type { MutationResolvers } from "@td/codegen-back";
import { addToSsdRegistry } from "./mutations/addToSsdRegistry";
import { addToIncomingWasteRegistry } from "./mutations/addToIncomingWasteRegistry";
import { addToIncomingTexsRegistry } from "./mutations/addToIncomingTexsRegistry";
import { importFile } from "./mutations/importFile";
import { getGenerateRegistryV2Export } from "./mutations/generateRegistryV2Export";
import { addToOutgoingTexsRegistry } from "./mutations/addToOutgoingTexsRegistry";
import { addToOutgoingWasteRegistry } from "./mutations/addToOutgoingWasteRegistry";
import { addToTransportedRegistry } from "./mutations/addToTransportedRegistry";
import { addToManagedRegistry } from "./mutations/addToManagedRegistry";
import { cancelRegistryV2Lines } from "./mutations/cancelRegistryV2Lines";
import { getGenerateRegistryExhaustiveExport } from "./mutations/generateRegistryExhaustiveExport";
import { createTexsAnalysisFile } from "./mutations/createTexsAnalysisFile";

export const Mutation: MutationResolvers = {
  importFile: importFile as any,
  addToSsdRegistry,
  addToIncomingWasteRegistry,
  addToIncomingTexsRegistry,
  addToOutgoingTexsRegistry,
  addToOutgoingWasteRegistry,
  addToTransportedRegistry,
  addToManagedRegistry,
  cancelRegistryV2Lines,
  generateRegistryV2Export: getGenerateRegistryV2Export({
    asAdmin: false
  }) as any,
  generateRegistryV2ExportAsAdmin: getGenerateRegistryV2Export({
    asAdmin: true
  }) as any,
  generateRegistryExhaustiveExport: getGenerateRegistryExhaustiveExport({
    asAdmin: false
  }) as any,
  generateRegistryExhaustiveExportAsAdmin: getGenerateRegistryExhaustiveExport({
    asAdmin: true
  }) as any,
  createTexsAnalysisFile
};
