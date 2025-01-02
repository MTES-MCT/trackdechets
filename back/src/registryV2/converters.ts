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
  RegistrySsd
} from "@prisma/client";
import type { RegistryV2ExportType } from "@td/codegen-back";
import { GenericWasteV2 } from "./types";
import { toIncomingWasteV2 as bsffToIncomingWasteV2 } from "../bsffs/registryV2";
import { toIncomingWasteV2 as bspaohToIncomingWasteV2 } from "../bspaoh/registryV2";
import { toIncomingWasteV2 as bsvhuToIncomingWasteV2 } from "../bsvhu/registryV2";
// add other types when other exports are added
type InputMap = {
  SSD: RegistrySsd | null;
  INCOMING_WASTE: RegistryIncomingWaste | null;
  INCOMING_TEXS: RegistryIncomingTexs | null;
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
  BSDD: exportOptions.BSDD?.toIncomingWaste,
  BSDA: exportOptions.BSDA?.toIncomingWaste,
  BSDASRI: exportOptions.BSDASRI?.toIncomingWaste,
  BSFF: bsffToIncomingWasteV2,
  BSPAOH: bspaohToIncomingWasteV2,
  BSVHU: bsvhuToIncomingWasteV2
};

const registryToWaste: Partial<
  Record<
    Exclude<RegistryV2ExportType, "ALL">,
    Partial<Record<keyof InputMap, any>>
  >
> = {
  SSD: inputToSsdWaste,
  INCOMING: inputToIncomingWaste
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
