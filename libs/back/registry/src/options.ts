import type {
  IncomingWasteV2,
  ManagedWasteV2,
  OutgoingWasteV2,
  SsdWasteV2,
  TransportedWasteV2
} from "@td/codegen-back";
import { SafeParseReturnType } from "zod";

import { SSD_HEADERS } from "./ssd/constants";
import { getSsdImportSiretsAssociations, saveSsdLine } from "./ssd/database";
import { safeParseAsyncSsd } from "./ssd/validation";

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

import { TRANSPORTED_HEADERS } from "./transported/constants";
import {
  getTransportedImportSiretsAssociations,
  saveTransportedLine
} from "./transported/database";
import { safeParseAsyncTransported } from "./transported/validation";

import { MANAGED_HEADERS } from "./managed/constants";
import {
  getManagedImportSiretsAssociations,
  saveManagedLine
} from "./managed/database";
import { safeParseAsyncManaged } from "./managed/validation";

import { toSsdWaste as SsdToSsdWaste } from "./ssd/registry";
import { toIncomingWaste as IncomingWasteToIncomingWaste } from "./incomingWaste/registry";
import { toIncomingWaste as IncomingTexsToIncomingWaste } from "./incomingTexs/registry";
import { toOutgoingWaste as OutgoingWasteToOutgoingWaste } from "./outgoingWaste/registry";
import { toOutgoingWaste as OutgoingTexsToOutgoingWaste } from "./outgoingTexs/registry";
import { toTransportedWaste as TransportedToTransportedWaste } from "./transported/registry";
import { toManagedWaste as ManagedToManagedWaste } from "./managed/registry";
export type ParsedLine = {
  id?: string;
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
  "OUTGOING_WASTE",
  "TRANSPORTED",
  "MANAGED"
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
  },
  TRANSPORTED: {
    headers: TRANSPORTED_HEADERS,
    safeParseAsync: safeParseAsyncTransported,
    saveLine: saveTransportedLine,
    getImportSiretsAssociations: getTransportedImportSiretsAssociations
  },
  MANAGED: {
    headers: MANAGED_HEADERS,
    safeParseAsync: safeParseAsyncManaged,
    saveLine: saveManagedLine,
    getImportSiretsAssociations: getManagedImportSiretsAssociations
  }
};

export const CSV_DELIMITER = ";";
export const UNAUTHORIZED_ERROR =
  "Vous ne pouvez pas déclarer pour ce SIRET dans la mesure où votre compte utilisateur n'y est pas rattaché et qu'aucune délégation est en cours";
export const PERMISSION_ERROR =
  "Votre rôle pour cet établissement ne vous permet pas d'effectuer des déclarations";
export const INTERNAL_ERROR =
  "Une erreur inconnue est survenue. Merci de contacter le support";

export type InputExportOptions = {
  toSsdWaste?: (registry: unknown) => SsdWasteV2;
  toIncomingWaste?: (registry: unknown) => IncomingWasteV2;
  toOutgoingWaste?: (registry: unknown) => OutgoingWasteV2;
  toTransportedWaste?: (registry: unknown) => TransportedWasteV2;
  toManagedWaste?: (registry: unknown) => ManagedWasteV2;
};

export const INPUT_EXPORT_TYPES = [
  "SSD",
  "INCOMING_WASTE",
  "INCOMING_TEXS",
  "OUTGOING_WASTE",
  "OUTGOING_TEXS",
  "TRANSPORTED",
  "MANAGED",
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
  },
  OUTGOING_WASTE: {
    toOutgoingWaste: OutgoingWasteToOutgoingWaste
  },
  OUTGOING_TEXS: {
    toOutgoingWaste: OutgoingTexsToOutgoingWaste
  },
  TRANSPORTED: {
    toTransportedWaste: TransportedToTransportedWaste
  },
  MANAGED: {
    toManagedWaste: ManagedToManagedWaste
  }
};
