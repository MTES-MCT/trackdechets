import { format } from "date-fns";
import { WasteRegistryType } from "../generated/graphql/types";

export function getRegistryFileName(
  registryType: WasteRegistryType,
  sirets: string[]
) {
  const components = [
    "TD-Registre",
    format(new Date(), "yyyyMMdd"),
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
    INCOMING: "Entrant",
    OUTGOING: "Sortant",
    TRANSPORTED: "Transport",
    MANAGED: "Gestion",
    ALL: "Exhaustif"
  };
  return typename ? mapping[typename] : "";
}
