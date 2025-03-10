import type { QueryResolvers } from "@td/codegen-back";
import { registryV2Exports } from "./queries/registryV2Exports";
import { registryV2Export } from "./queries/registryV2Export";
import { registryV2ExportDownloadSignedUrl } from "./queries/registryV2ExportDownloadSignedUrl";
import { registryUploadSignedUrl } from "./queries/registryUploadSignedUrl";
import { registryDownloadSignedUrl } from "./queries/registryDownloadSignedUrl";
import { registryImports } from "./queries/registryImports";
import { registryImport } from "./queries/registryImport";
import { registryChangeAggregates } from "./queries/registryChangeAggregates";
import { registryLookup } from "./queries/registryLookup";
import { registryLookups } from "./queries/registryLookups";

export const Query: QueryResolvers = {
  registryUploadSignedUrl,
  registryDownloadSignedUrl,
  registryImports: registryImports as any,
  registryImport: registryImport as any,
  registryV2ExportDownloadSignedUrl,
  registryV2Exports: registryV2Exports as any,
  registryV2Export: registryV2Export as any,
  registryChangeAggregates: registryChangeAggregates as any,
  registryLookup,
  registryLookups
};
