import { exportOptions } from "@td/registry";
import {
  RegistryIncomingTexs,
  RegistryIncomingWaste,
  RegistryOutgoingTexs,
  RegistryOutgoingWaste,
  RegistryTransported,
  RegistrySsd,
  RegistryManaged
} from "@prisma/client";
import type {
  IncomingWasteV2,
  ManagedWasteV2,
  OutgoingWasteV2,
  RegistryV2ExportType,
  SsdWasteV2,
  TransportedWasteV2,
  AllWasteV2
} from "@td/codegen-back";
import {
  GenericWasteV2,
  RegistryV2Bsdd,
  RegistryV2Bsda,
  RegistryV2Bsdasri,
  RegistryV2Bsff,
  RegistryV2Bspaoh,
  RegistryV2Bsvhu
} from "./types";
import {
  toIncomingWasteV2 as bsddToIncomingWasteV2,
  toOutgoingWasteV2 as bsddToOutgoingWasteV2,
  toTransportedWasteV2 as bsddToTransportedWasteV2,
  toManagedWasteV2 as bsddToManagedWasteV2,
  toAllWasteV2 as bsddToAllWasteV2
} from "../forms/registryV2";
import {
  toIncomingWasteV2 as bsdaToIncomingWasteV2,
  toOutgoingWasteV2 as bsdaToOutgoingWasteV2,
  toTransportedWasteV2 as bsdaToTransportedWasteV2,
  toManagedWasteV2 as bsdaToManagedWasteV2,
  toAllWasteV2 as bsdaToAllWasteV2
} from "../bsda/registryV2";
import {
  toIncomingWasteV2 as bsdasriToIncomingWasteV2,
  toOutgoingWasteV2 as bsdasriToOutgoingWasteV2,
  toTransportedWasteV2 as bsdasriToTransportedWasteV2,
  toManagedWasteV2 as bsdasriToManagedWasteV2,
  toAllWasteV2 as bsdasriToAllWasteV2
} from "../bsdasris/registryV2";
import {
  toIncomingWasteV2 as bsffToIncomingWasteV2,
  toOutgoingWasteV2 as bsffToOutgoingWasteV2,
  toTransportedWasteV2 as bsffToTransportedWasteV2,
  toAllWasteV2 as bsffToAllWasteV2
} from "../bsffs/registryV2";
import {
  toIncomingWasteV2 as bspaohToIncomingWasteV2,
  toOutgoingWasteV2 as bspaohToOutgoingWasteV2,
  toTransportedWasteV2 as bspaohToTransportedWasteV2,
  toAllWasteV2 as bspaohToAllWasteV2
} from "../bspaoh/registryV2";
import {
  toIncomingWasteV2 as bsvhuToIncomingWasteV2,
  toOutgoingWasteV2 as bsvhuToOutgoingWasteV2,
  toTransportedWasteV2 as bsvhuToTransportedWasteV2,
  toManagedWasteV2 as bsvhuToManagedWasteV2,
  toAllWasteV2 as bsvhuToAllWasteV2
} from "../bsvhu/registryV2";
// add other types when other exports are added
type InputMap = {
  SSD?: RegistrySsd | null;
  INCOMING_WASTE?: RegistryIncomingWaste | null;
  INCOMING_TEXS?: RegistryIncomingTexs | null;
  OUTGOING_WASTE?: RegistryOutgoingWaste | null;
  OUTGOING_TEXS?: RegistryOutgoingTexs | null;
  TRANSPORTED?: RegistryTransported | null;
  MANAGED?: RegistryManaged | null;
  BSDD?: RegistryV2Bsdd | null;
  BSDA?: RegistryV2Bsda | null;
  BSDASRI?: RegistryV2Bsdasri | null;
  BSFF?: RegistryV2Bsff | null;
  BSPAOH?: RegistryV2Bspaoh | null;
  BSVHU?: RegistryV2Bsvhu | null;
};

// Helper type to get the non-null type from InputMap
type NonNullInputMap = {
  [K in keyof InputMap]: NonNullable<InputMap[K]>;
};

// Type for a function that takes a non-null input and returns a specific type
type ConverterFunction<T, R> = (input: T, targetSiret: string) => R | null;

// Type for the mapping object with specific return type
type ConverterMap<T extends keyof InputMap, R> = {
  [K in T]?: ConverterFunction<NonNullInputMap[K], R>;
};

const inputToSsdWaste: ConverterMap<keyof InputMap, SsdWasteV2> = {
  SSD: exportOptions.SSD?.toSsdWaste
};

const inputToIncomingWaste: ConverterMap<keyof InputMap, IncomingWasteV2> = {
  INCOMING_WASTE: exportOptions.INCOMING_WASTE?.toIncomingWaste,
  INCOMING_TEXS: exportOptions.INCOMING_TEXS?.toIncomingWaste,
  BSDD: bsddToIncomingWasteV2,
  BSDA: bsdaToIncomingWasteV2,
  BSDASRI: bsdasriToIncomingWasteV2,
  BSFF: bsffToIncomingWasteV2,
  BSPAOH: bspaohToIncomingWasteV2,
  BSVHU: bsvhuToIncomingWasteV2
};

const inputToOutgoingWaste: ConverterMap<keyof InputMap, OutgoingWasteV2> = {
  OUTGOING_WASTE: exportOptions.OUTGOING_WASTE?.toOutgoingWaste,
  OUTGOING_TEXS: exportOptions.OUTGOING_TEXS?.toOutgoingWaste,
  BSDD: bsddToOutgoingWasteV2,
  BSDA: bsdaToOutgoingWasteV2,
  BSDASRI: bsdasriToOutgoingWasteV2,
  BSFF: bsffToOutgoingWasteV2,
  BSPAOH: bspaohToOutgoingWasteV2,
  BSVHU: bsvhuToOutgoingWasteV2
};

const inputToTransportedWaste: ConverterMap<
  keyof InputMap,
  TransportedWasteV2
> = {
  TRANSPORTED: exportOptions.TRANSPORTED?.toTransportedWaste,
  BSDD: bsddToTransportedWasteV2,
  BSDA: bsdaToTransportedWasteV2,
  BSDASRI: bsdasriToTransportedWasteV2,
  BSFF: bsffToTransportedWasteV2,
  BSPAOH: bspaohToTransportedWasteV2,
  BSVHU: bsvhuToTransportedWasteV2
};
const inputToManagedWaste: ConverterMap<keyof InputMap, ManagedWasteV2> = {
  MANAGED: exportOptions.MANAGED?.toManagedWaste,
  BSDD: bsddToManagedWasteV2,
  BSDA: bsdaToManagedWasteV2,
  BSDASRI: bsdasriToManagedWasteV2,
  BSFF: () => null,
  BSPAOH: () => null,
  BSVHU: bsvhuToManagedWasteV2
};

const inputToAllWaste: ConverterMap<keyof InputMap, AllWasteV2> = {
  BSDD: bsddToAllWasteV2,
  BSDA: bsdaToAllWasteV2,
  BSDASRI: bsdasriToAllWasteV2,
  BSFF: bsffToAllWasteV2,
  BSPAOH: bspaohToAllWasteV2,
  BSVHU: bsvhuToAllWasteV2
};

const registryToWaste: Record<
  RegistryV2ExportType | "ALL",
  Partial<Record<keyof InputMap, any>>
> = {
  SSD: inputToSsdWaste,
  INCOMING: inputToIncomingWaste,
  OUTGOING: inputToOutgoingWaste,
  TRANSPORTED: inputToTransportedWaste,
  MANAGED: inputToManagedWaste,
  ALL: inputToAllWaste
};

export function toWaste<
  WasteType extends GenericWasteV2,
  RegistryType extends RegistryV2ExportType
>(
  registryType: RegistryV2ExportType | "ALL",
  targetSiret: RegistryType extends "TRANSPORTED" | "MANAGED"
    ? string
    : string | undefined,
  input: InputMap
  // remove undefined once all types are defined
): WasteType | undefined {
  const converter = registryToWaste[registryType];
  const {
    SSD,
    INCOMING_WASTE,
    INCOMING_TEXS,
    OUTGOING_WASTE,
    OUTGOING_TEXS,
    TRANSPORTED,
    MANAGED,
    BSDD,
    BSDA,
    BSDASRI,
    BSFF,
    BSPAOH,
    BSVHU
  } = input;
  if (SSD) {
    return converter.SSD?.(SSD, targetSiret);
  } else if (INCOMING_WASTE) {
    return converter.INCOMING_WASTE?.(INCOMING_WASTE, targetSiret);
  } else if (INCOMING_TEXS) {
    return converter.INCOMING_TEXS?.(INCOMING_TEXS, targetSiret);
  } else if (OUTGOING_WASTE) {
    return converter.OUTGOING_WASTE?.(OUTGOING_WASTE, targetSiret);
  } else if (OUTGOING_TEXS) {
    return converter.OUTGOING_TEXS?.(OUTGOING_TEXS, targetSiret);
  } else if (TRANSPORTED) {
    return converter.TRANSPORTED?.(TRANSPORTED, targetSiret);
  } else if (MANAGED) {
    return converter.MANAGED?.(MANAGED, targetSiret);
  } else if (BSDD) {
    return converter.BSDD?.(BSDD, targetSiret);
  } else if (BSDA) {
    return converter.BSDA?.(BSDA, targetSiret);
  } else if (BSDASRI) {
    return converter.BSDASRI?.(BSDASRI, targetSiret);
  } else if (BSFF) {
    return converter.BSFF?.(BSFF, targetSiret);
  } else if (BSPAOH) {
    return converter.BSPAOH?.(BSPAOH, targetSiret);
  } else if (BSVHU) {
    return converter.BSVHU?.(BSVHU, targetSiret);
  }
  return;
}
