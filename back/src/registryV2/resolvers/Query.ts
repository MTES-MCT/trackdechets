import type { QueryResolvers } from "@td/codegen-back";
import { registryV2Exports } from "./queries/registryV2Exports";
import { registryV2Export } from "./queries/registryV2Export";
import { registryV2ExportDownloadSignedUrl } from "./queries/registryV2ExportDownloadSignedUrl";

export const Query: QueryResolvers = {
  registryV2ExportDownloadSignedUrl,
  registryV2Exports: registryV2Exports as any,
  registryV2Export: registryV2Export as any
};
