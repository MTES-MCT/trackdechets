import { InfoIconCode, InfoIconValue } from "./infoWithIconTypes";

export const getLabelValue = (code: InfoIconCode): InfoIconValue => {
  switch (code) {
    case InfoIconCode.TempStorage:
      return InfoIconValue.TempStorage;
    case InfoIconCode.EcoOrganism:
      return InfoIconValue.EcoOrganism;
    case InfoIconCode.LastModificationDate:
      return InfoIconValue.LastModificationDate;
    case InfoIconCode.CustomInfo:
      return InfoIconValue.CustomInfo;
    case InfoIconCode.TransporterNumberPlate:
      return InfoIconValue.TransporterNumberPlate;
    case InfoIconCode.CustomId:
      return InfoIconValue.CustomId;
    default:
      return InfoIconValue.default;
  }
};
