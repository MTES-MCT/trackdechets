import { format } from "date-fns";
import { WasteRegisterType } from "../generated/graphql/types";

export function getRegisterFileName(
  registerType: WasteRegisterType,
  sirets: string[]
) {
  const components = [
    "TD-Registre",
    format(new Date(), "yyyyMMdd"),
    formatRegisterType(registerType)
  ];

  if (sirets.length === 1) {
    components.push(sirets[0]);
  }

  const filename = components.join("-");

  return filename;
}

export function formatRegisterType(typename: WasteRegisterType) {
  const mapping: Record<WasteRegisterType, string> = {
    INCOMING: "Entrant",
    OUTGOING: "Sortant",
    TRANSPORTED: "Transport",
    MANAGED: "Gestion",
    ALL: "Exhaustif"
  };
  return typename ? mapping[typename] : "";
}
