import { BsdaConsistence } from "@td/codegen-ui";

export function getWasteConsistenceLabel(
  consistence: BsdaConsistence,
  description?: string | null
) {
  switch (consistence) {
    case BsdaConsistence.Solide:
      return "Solide";

    case BsdaConsistence.Other:
      return `Autre ${description ? `(${description})` : ""}`;

    case BsdaConsistence.Pulverulent:
      return "Pulvérulent";

    case BsdaConsistence.Pateux:
      return "Pâteux";

    default:
      return "";
  }
}
