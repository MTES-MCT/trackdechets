import type { QueryResolvers } from "@td/codegen-back";
import incomingWastes from "./queries/incomingWastes";
import outgoingWastes from "./queries/outgoingWastes";
import transportedWastes from "./queries/transportedWastes";
import managedWastes from "./queries/managedWastes";
import allWastes from "./queries/allWastes";
import wastesRegistryCsv from "./queries/wastesRegistryCsv";
import wastesRegistryXls from "./queries/wastesRegistryXls";
import { registryUploadSignedUrl } from "./queries/registryUploadSignedUrl";
import { registryDownloadSignedUrl } from "./queries/registryDownloadSignedUrl";
import { registryImports } from "./queries/registryImports";
import { registryImport } from "./queries/registryImport";

export const Query: QueryResolvers = {
  incomingWastes,
  outgoingWastes,
  transportedWastes,
  managedWastes,
  allWastes,
  wastesRegistryCsv,
  wastesRegistryXls,
  registryUploadSignedUrl,
  registryDownloadSignedUrl,
  registryImports: registryImports as any,
  registryImport: registryImport as any
};
