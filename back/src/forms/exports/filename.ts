import { FormsRegisterExportType } from "../../generated/graphql/types";

/**
 * Returns a filename corresponding to exports filters
 */
export function getExportsFileName(
  exportType: FormsRegisterExportType,
  sirets: string[],
  wasteCode?: string
) {
  const readableExportTypes: { [key in FormsRegisterExportType]: string } = {
    ALL: "exhaustif",
    OUTGOING: "sortant",
    INCOMING: "entrant",
    TRANSPORTED: "transporteur",
    TRADED: "négociant"
  };

  const components = ["TD-registre", readableExportTypes[exportType]];

  if (sirets.length === 1) {
    components.push(sirets[0]);
  }

  if (wasteCode) {
    components.push(wasteCode);
  }

  const filename = components.join("-");

  return filename;
}
