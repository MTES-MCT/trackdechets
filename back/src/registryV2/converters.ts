import { exportOptions } from "@td/registry";
import { RegistrySsd } from "@prisma/client";
import type { RegistryV2ExportType } from "@td/codegen-back";

import { GenericWasteV2 } from "./types";
// add other types when other exports are added
type RegistryInputMap = {
  SSD: RegistrySsd | null;
};

const registryToSsdWaste = {
  // "?." because it's partial. Once completed, remove the partial and "?."
  SSD: exportOptions.SSD?.toSsdWaste
};

const registryToWaste: Record<"SSD", any> = {
  SSD: registryToSsdWaste
};

export function toWaste<WasteType extends GenericWasteV2>(
  registryType: RegistryV2ExportType,
  input: RegistryInputMap
  // remove undefined once all types are defined
): WasteType | undefined {
  const converter = registryToWaste[registryType];
  const { SSD } = input;
  if (input.SSD) {
    return converter.SSD?.(SSD);
  }
  return;
}
