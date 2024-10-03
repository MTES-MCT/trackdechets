import { InfoIconCode, InfoIconValue } from "./infoWithIconTypes";

export const getLabelValue = (code: InfoIconCode): InfoIconValue => {
  switch (code) {
    case InfoIconCode.TempStorage:
      return InfoIconValue.TempStorage;
    case InfoIconCode.EcoOrganism:
      return InfoIconValue.default;
    case InfoIconCode.LastModificationDate:
      return InfoIconValue.LastModificationDate;
    case InfoIconCode.CustomInfo:
      return InfoIconValue.CustomInfo;
    case InfoIconCode.TransporterNumberPlate:
      return InfoIconValue.default;
    case InfoIconCode.CustomId:
      return InfoIconValue.CustomId;
    case InfoIconCode.Cap:
      return InfoIconValue.Cap;
    default:
      return InfoIconValue.default;
  }
};
