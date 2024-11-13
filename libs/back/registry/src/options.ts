import { SafeParseReturnType } from "zod";
import { SSD_EXPORT_HEADERS, SSD_HEADERS } from "./ssd/constants";
import { safeParseAsyncSsd } from "./ssd/validation";
import { getSsdImportSiretsAssociations, saveSsdLine } from "./ssd/database";
import { INCOMING_WASTE_HEADERS } from "./incomingWaste/constants";
import {
  saveIncomingWasteLine,
  getIncomingWasteImportSiretsAssociations
} from "./incomingWaste/database";
import { safeParseAsyncIncomingWaste } from "./incomingWaste/validation";
import { RegistryExportType } from "@prisma/client";
import { toSsdWaste } from "./ssd/registry";
import { SsdWaste } from "@td/codegen-back";

export type ParsedLine = {
  reason?: "MODIFIER" | "ANNULER" | "IGNORER";
  publicId: string;
  reportForSiret: string;
  reportAsSiret?: string;
};

export type ImportOptions = {
  headers: Record<string, string>;
  safeParseAsync: (
    line: unknown
  ) => Promise<SafeParseReturnType<unknown, ParsedLine>>;
  saveLine: ({
    line,
    importId
  }: {
    line: ParsedLine;
    importId: string | null;
  }) => Promise<void>;
  getImportSiretsAssociations: (
    importId: string
  ) => Promise<{ for: string; as: string }[]>;
};

export const IMPORT_TYPES = ["SSD", "INCOMING_WASTE"] as const;
export type ImportType = (typeof IMPORT_TYPES)[number];

export const importOptions: Record<ImportType, ImportOptions> = {
  SSD: {
    headers: SSD_HEADERS,
    safeParseAsync: safeParseAsyncSsd,
    saveLine: saveSsdLine,
    getImportSiretsAssociations: getSsdImportSiretsAssociations
  },
  INCOMING_WASTE: {
    headers: INCOMING_WASTE_HEADERS,
    safeParseAsync: safeParseAsyncIncomingWaste,
    saveLine: saveIncomingWasteLine,
    getImportSiretsAssociations: getIncomingWasteImportSiretsAssociations
  }
};

export const CSV_DELIMITER = ";";
export const UNAUTHORIZED_ERROR =
  "Vous n'avez pas le droit de faire une déclaration pour ce SIRET";

export type ExportOptions = {
  headers: Record<string, string>;
  toSsdWaste?: (registry: unknown) => SsdWaste;
};

export const exportOptions: Partial<Record<RegistryExportType, ExportOptions>> =
  {
    SSD: {
      headers: SSD_EXPORT_HEADERS,
      toSsdWaste
    }
  };
