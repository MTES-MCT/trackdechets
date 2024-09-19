import { SafeParseReturnType } from "zod";
import { SSD_HEADERS } from "./ssd/constants";
import { safeParseAsyncSsd } from "./ssd/validation";
import { getSsdImportSiretsAssociations, saveSsdLine } from "./ssd/database";

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

export const IMPORT_TYPES = ["SSD"] as const;
export type ImportType = (typeof IMPORT_TYPES)[number];

export const importOptions: Record<ImportType, ImportOptions> = {
  SSD: {
    headers: SSD_HEADERS,
    safeParseAsync: safeParseAsyncSsd,
    saveLine: saveSsdLine,
    getImportSiretsAssociations: getSsdImportSiretsAssociations
  }
};

export const CSV_DELIMITER = ";";
export const UNAUTHORIZED_ERROR =
  "Vous n'avez pas le droit de faire une déclaration pour ce SIRET";
