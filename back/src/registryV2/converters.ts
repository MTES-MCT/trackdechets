import { exportOptions } from "@td/registry";
import {
  Bsda,
  Bsdasri,
  Bsff,
  Bspaoh,
  Bsvhu,
  Form,
  RegistryIncomingTexs,
  RegistryIncomingWaste,
  RegistryOutgoingTexs,
  RegistryOutgoingWaste,
  RegistryTransported,
  RegistrySsd
} from "@prisma/client";
import type { RegistryV2ExportType } from "@td/codegen-back";
import { GenericWasteV2 } from "./types";
import {
  toIncomingWasteV2 as bsddToIncomingWasteV2,
  toOutgoingWasteV2 as bsddToOutgoingWasteV2,
  toTransportedWasteV2 as bsddToTransportedWasteV2
} from "../forms/registryV2";
import {
  toIncomingWasteV2 as bsdaToIncomingWasteV2,
  toOutgoingWasteV2 as bsdaToOutgoingWasteV2,
  toTransportedWasteV2 as bsdaToTransportedWasteV2
} from "../bsda/registryV2";
import {
  toIncomingWasteV2 as bsdasriToIncomingWasteV2,
  toOutgoingWasteV2 as bsdasriToOutgoingWasteV2,
  toTransportedWasteV2 as bsdasriToTransportedWasteV2
} from "../bsdasris/registryV2";
import {
  toIncomingWasteV2 as bsffToIncomingWasteV2,
  toOutgoingWasteV2 as bsffToOutgoingWasteV2,
  toTransportedWasteV2 as bsffToTransportedWasteV2
} from "../bsffs/registryV2";
import {
  toIncomingWasteV2 as bspaohToIncomingWasteV2,
  toOutgoingWasteV2 as bspaohToOutgoingWasteV2,
  toTransportedWasteV2 as bspaohToTransportedWasteV2
} from "../bspaoh/registryV2";
import {
  toIncomingWasteV2 as bsvhuToIncomingWasteV2,
  toOutgoingWasteV2 as bsvhuToOutgoingWasteV2,
  toTransportedWasteV2 as bsvhuToTransportedWasteV2
} from "../bsvhu/registryV2";
// add other types when other exports are added
type InputMap = {
  SSD: RegistrySsd | null;
  INCOMING_WASTE: RegistryIncomingWaste | null;
  INCOMING_TEXS: RegistryIncomingTexs | null;
  OUTGOING_WASTE: RegistryOutgoingWaste | null;
  OUTGOING_TEXS: RegistryOutgoingTexs | null;
  TRANSPORTED: RegistryTransported | null;
  BSDD: Form | null;
  BSDA: Bsda | null;
  BSDASRI: Bsdasri | null;
  BSFF: Bsff | null;
  BSPAOH: Bspaoh | null;
  BSVHU: Bsvhu | null;
};

const inputToSsdWaste: Partial<Record<keyof InputMap, any>> = {
  // "?." because it's partial. Once completed, remove the partial and "?."
  SSD: exportOptions.SSD?.toSsdWaste
};

const inputToIncomingWaste: Partial<Record<keyof InputMap, any>> = {
  INCOMING_WASTE: exportOptions.INCOMING_WASTE?.toIncomingWaste,
  INCOMING_TEXS: exportOptions.INCOMING_TEXS?.toIncomingWaste,
  BSDD: bsddToIncomingWasteV2,
  BSDA: bsdaToIncomingWasteV2,
  BSDASRI: bsdasriToIncomingWasteV2,
  BSFF: bsffToIncomingWasteV2,
  BSPAOH: bspaohToIncomingWasteV2,
  BSVHU: bsvhuToIncomingWasteV2
};

const inputToOutgoingWaste: Partial<Record<keyof InputMap, any>> = {
  OUTGOING_WASTE: exportOptions.OUTGOING_WASTE?.toOutgoingWaste,
  OUTGOING_TEXS: exportOptions.OUTGOING_TEXS?.toOutgoingWaste,
  BSDD: bsddToOutgoingWasteV2,
  BSDA: bsdaToOutgoingWasteV2,
  BSDASRI: bsdasriToOutgoingWasteV2,
  BSFF: bsffToOutgoingWasteV2,
  BSPAOH: bspaohToOutgoingWasteV2,
  BSVHU: bsvhuToOutgoingWasteV2
};

const inputToTransportedWaste: Partial<Record<keyof InputMap, any>> = {
  TRANSPORTED: exportOptions.TRANSPORTED?.toTransportedWaste,
  BSDD: bsddToTransportedWasteV2,
  BSDA: bsdaToTransportedWasteV2,
  BSDASRI: bsdasriToTransportedWasteV2,
  BSFF: bsffToTransportedWasteV2,
  BSPAOH: bspaohToTransportedWasteV2,
  BSVHU: bsvhuToTransportedWasteV2
};

const registryToWaste: Partial<
  Record<
    Exclude<RegistryV2ExportType, "ALL">,
    Partial<Record<keyof InputMap, any>>
  >
> = {
  SSD: inputToSsdWaste,
  INCOMING: inputToIncomingWaste,
  OUTGOING: inputToOutgoingWaste,
  TRANSPORTED: inputToTransportedWaste
};

export function toWaste<WasteType extends GenericWasteV2>(
  registryType: RegistryV2ExportType,
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
    BSDD,
    BSDA,
    BSDASRI,
    BSFF,
    BSPAOH,
    BSVHU
  } = input;
  if (SSD) {
    return converter.SSD?.(SSD);
  } else if (INCOMING_WASTE) {
    return converter.INCOMING_WASTE?.(INCOMING_WASTE);
  } else if (INCOMING_TEXS) {
    return converter.INCOMING_TEXS?.(INCOMING_TEXS);
  } else if (OUTGOING_WASTE) {
    return converter.OUTGOING_WASTE?.(OUTGOING_WASTE);
  } else if (OUTGOING_TEXS) {
    return converter.OUTGOING_TEXS?.(OUTGOING_TEXS);
  } else if (TRANSPORTED) {
    return converter.TRANSPORTED?.(TRANSPORTED);
  } else if (BSDD) {
    return converter.BSDD?.(BSDD);
  } else if (BSDA) {
    return converter.BSDA?.(BSDA);
  } else if (BSDASRI) {
    return converter.BSDASRI?.(BSDASRI);
  } else if (BSFF) {
    return converter.BSFF?.(BSFF);
  } else if (BSPAOH) {
    return converter.BSPAOH?.(BSPAOH);
  } else if (BSVHU) {
    return converter.BSVHU?.(BSVHU);
  }
  return;
}
