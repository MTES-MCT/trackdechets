export function getWasteDescription(wasteCode: string) {
  return wasteCode === "18 01 02*"
    ? "DASRI origine animale"
    : wasteCode === "18 01 02*"
    ? "DASRI d'origine humaine"
    : "";
}
