import type { QueryResolvers } from "@td/codegen-back";
import { getRegistryV2Exports } from "./queries/registryV2Exports";
import { registryV2Export } from "./queries/registryV2Export";
import { registryV2ExportDownloadSignedUrl } from "./queries/registryV2ExportDownloadSignedUrl";
import { registryUploadSignedUrl } from "./queries/registryUploadSignedUrl";
import { registryDownloadSignedUrl } from "./queries/registryDownloadSignedUrl";
import { registryImports } from "./queries/registryImports";
import { registryImport } from "./queries/registryImport";
import { registryChangeAggregates } from "./queries/registryChangeAggregates";
import { registryLookup } from "./queries/registryLookup";
import { registryLookups } from "./queries/registryLookups";
import { registryExhaustiveExportDownloadSignedUrl } from "./queries/registryExhaustiveExportDownloadSignedUrl";
import { getRegistryExhaustiveExports } from "./queries/registryExhaustiveExports";
import { registryExhaustiveExport } from "./queries/registryExhaustiveExport";
import { registryUploadTexsAnalysisSignedUrl } from "./queries/registryUploadTexsAnalysisSignedUrl";
import { registryDownloadTexsAnalysisSignedUrl } from "./queries/registryDownloadTexsAnalysisSignedUrl";

export const Query: QueryResolvers = {
  registryUploadSignedUrl,
  registryDownloadSignedUrl,
  registryImports: registryImports as any,
  registryImport: registryImport as any,
  registryV2ExportDownloadSignedUrl,
  registryV2Exports: getRegistryV2Exports({ asAdmin: false }) as any,
  registryV2ExportsAsAdmin: getRegistryV2Exports({ asAdmin: true }) as any,
  registryV2Export: registryV2Export as any,
  registryExhaustiveExportDownloadSignedUrl,
  registryExhaustiveExports: getRegistryExhaustiveExports({
    asAdmin: false
  }) as any,
  registryExhaustiveExportsAsAdmin: getRegistryExhaustiveExports({
    asAdmin: true
  }) as any,
  registryExhaustiveExport: registryExhaustiveExport as any,
  registryChangeAggregates: registryChangeAggregates as any,
  registryLookup,
  registryLookups,
  registryUploadTexsAnalysisSignedUrl,
  registryDownloadTexsAnalysisSignedUrl
};
