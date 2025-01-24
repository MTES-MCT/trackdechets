import { RegistryExportType } from "@prisma/client";
import type { SsdWasteV2 } from "@td/codegen-back";
import { SafeParseReturnType } from "zod";
import { INCOMING_TEXS_HEADERS } from "./incomingTexs/constants";
import {
  getIncomingTexsImportSiretsAssociations,
  saveIncomingTexsLine
} from "./incomingTexs/database";
import { safeParseAsyncIncomingTexs } from "./incomingTexs/validation";
import { INCOMING_WASTE_HEADERS } from "./incomingWaste/constants";
import {
  getIncomingWasteImportSiretsAssociations,
  saveIncomingWasteLine
} from "./incomingWaste/database";
import { safeParseAsyncIncomingWaste } from "./incomingWaste/validation";
import { OUTGOING_TEXS_HEADERS } from "./outgoingTexs/constants";
import {
  getOutgoingTexsImportSiretsAssociations,
  saveOutgoingTexsLine
} from "./outgoingTexs/database";
import { safeParseAsyncOutgoingTexs } from "./outgoingTexs/validation";
import { OUTGOING_WASTE_HEADERS } from "./outgoingWaste/constants";
import {
  getOutgoingWasteImportSiretsAssociations,
  saveOutgoingWasteLine
} from "./outgoingWaste/database";
import { safeParseAsyncOutgoingWaste } from "./outgoingWaste/validation";
import { SSD_EXPORT_HEADERS, SSD_HEADERS } from "./ssd/constants";
import { getSsdImportSiretsAssociations, saveSsdLine } from "./ssd/database";
import { toSsdWaste } from "./ssd/registry";
import { safeParseAsyncSsd } from "./ssd/validation";

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
  "OUTGOING_TEXS",
  "OUTGOING_WASTE"
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
  },
  OUTGOING_WASTE: {
    headers: OUTGOING_WASTE_HEADERS,
    safeParseAsync: safeParseAsyncOutgoingWaste,
    saveLine: saveOutgoingWasteLine,
    getImportSiretsAssociations: getOutgoingWasteImportSiretsAssociations
  }
};

export const CSV_DELIMITER = ";";
export const UNAUTHORIZED_ERROR =
  "Vous n'avez pas le droit de faire une déclaration pour ce SIRET";

export type ExportOptions = {
  headers: Record<string, string>;
  toSsdWaste?: (registry: unknown) => SsdWasteV2;
};

export const exportOptions: Partial<Record<RegistryExportType, ExportOptions>> =
  {
    SSD: {
      headers: SSD_EXPORT_HEADERS,
      toSsdWaste
    }
  };
