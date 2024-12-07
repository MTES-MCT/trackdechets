import { format } from "date-fns";
import { WasteRegistryType } from "@td/codegen-back";

export function getRegistryFileName(
  registryType: WasteRegistryType,
  sirets: string[],
  date?: Date
) {
  const components = [
    "TD-Registre",
    format(date ?? new Date(), "yyyyMMdd"),
    formatRegistryType(registryType)
  ];

  if (sirets.length === 1) {
    components.push(sirets[0]);
  }

  const filename = components.join("-");

  return filename;
}

export function formatRegistryType(typename: WasteRegistryType) {
  const mapping: Record<WasteRegistryType, string> = {
    SSD: "Sortie de statut de déchet",
    INCOMING: "Entrant",
    OUTGOING: "Sortant",
    TRANSPORTED: "Transport",
    MANAGED: "Gestion",
    ALL: "Exhaustif"
  };
  return typename ? mapping[typename] : "";
}
