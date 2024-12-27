import { SafeParseReturnType } from "zod";
import { SSD_HEADERS } from "./ssd/constants";
import { safeParseAsyncSsd } from "./ssd/validation";
import { getSsdImportSiretsAssociations, saveSsdLine } from "./ssd/database";
import { INCOMING_WASTE_HEADERS } from "./incomingWaste/constants";
import {
  saveIncomingWasteLine,
  getIncomingWasteImportSiretsAssociations
} from "./incomingWaste/database";
import { safeParseAsyncIncomingWaste } from "./incomingWaste/validation";
import { toSsdWaste as SsdToSsdWaste } from "./ssd/registry";
import { toIncomingWaste as IncomingWasteToIncomingWaste } from "./incomingWaste/registry";
import { toIncomingWaste as IncomingTexsToIncomingWaste } from "./incomingWaste/registry";
import type { IncomingWasteV2, SsdWasteV2 } from "@td/codegen-back";
import { INCOMING_TEXS_HEADERS } from "./incomingTexs/constants";
import {
  saveIncomingTexsLine,
  getIncomingTexsImportSiretsAssociations
} from "./incomingTexs/database";
import { safeParseAsyncIncomingTexs } from "./incomingTexs/validation";
import { OUTGOING_TEXS_HEADERS } from "./outgoingTexs/constants";
import { safeParseAsyncOutgoingTexs } from "./outgoingTexs/validation";
import {
  getOutgoingTexsImportSiretsAssociations,
  saveOutgoingTexsLine
} from "./outgoingTexs/database";

export type ParsedLine = {
  reason?: "MODIFIER" | "ANNULER" | "IGNORER" | null;
  publicId: string;
  reportForCompanySiret: string;
  reportAsCompanySiret?: string | null;
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
    line: ParsedLine & { createdById: string };
    importId: string | null;
  }) => Promise<void>;
  getImportSiretsAssociations: (
    importId: string
  ) => Promise<{ for: string; as: string }[]>;
};

export const ERROR_HEADER = "Erreur";
export const IMPORT_TYPES = [
  "SSD",
  "INCOMING_WASTE",
  "INCOMING_TEXS",
  "OUTGOING_TEXS"
] as const;
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
  },
  INCOMING_TEXS: {
    headers: INCOMING_TEXS_HEADERS,
    safeParseAsync: safeParseAsyncIncomingTexs,
    saveLine: saveIncomingTexsLine,
    getImportSiretsAssociations: getIncomingTexsImportSiretsAssociations
  },
  OUTGOING_TEXS: {
    headers: OUTGOING_TEXS_HEADERS,
    safeParseAsync: safeParseAsyncOutgoingTexs,
    saveLine: saveOutgoingTexsLine,
    getImportSiretsAssociations: getOutgoingTexsImportSiretsAssociations
  }
};

export const CSV_DELIMITER = ";";
export const UNAUTHORIZED_ERROR =
  "Vous n'avez pas le droit de faire une déclaration pour ce SIRET";

export type InputExportOptions = {
  toSsdWaste?: (registry: unknown) => SsdWasteV2;
  toIncomingWaste?: (registry: unknown) => IncomingWasteV2;
};

export const INPUT_EXPORT_TYPES = [
  "SSD",
  "INCOMING_WASTE",
  "INCOMING_TEXS",
  "BSDD",
  "BSDA",
  "BSDASRI",
  "BSFF",
  "BSPAOH",
  "BSVHU"
] as const;
export type InputExportType = (typeof INPUT_EXPORT_TYPES)[number];

export type OutputExportOptions = {
  headers: Record<string, string>;
};

export const exportOptions: Partial<
  Record<InputExportType, InputExportOptions>
> = {
  SSD: {
    toSsdWaste: SsdToSsdWaste
  },
  INCOMING_WASTE: {
    toIncomingWaste: IncomingWasteToIncomingWaste
  },
  INCOMING_TEXS: {
    toIncomingWaste: IncomingTexsToIncomingWaste
  }
};
