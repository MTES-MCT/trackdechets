import { DASRI_WASTE_CODES_MAPPING } from "../common/constants";

export function getWasteDescription(wasteCode: string) {
  return DASRI_WASTE_CODES_MAPPING[wasteCode] ?? "";
}
