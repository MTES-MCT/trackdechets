import WasteCodeLookup from "./nomenclature-dechets.json";

export enum WasteCodeStatus {
  Ok,
  TooShort,
  TooLong,
  DoesNotExist
}

export function wasteCodeValidator(wasteCode: string) {
  const wasteCodeWithoutSpaces = wasteCode.replace(/\s+/g, "");
  if (wasteCodeWithoutSpaces.length < 6) {
    return WasteCodeStatus.TooShort;
  }
  if (wasteCodeWithoutSpaces.length > 7) {
    return WasteCodeStatus.TooLong;
  }
  
  if (WasteCodeLookup.find(l => l.code === wasteCode)) {
    return WasteCodeStatus.Ok;
  }
  
  return WasteCodeStatus.DoesNotExist;
}
