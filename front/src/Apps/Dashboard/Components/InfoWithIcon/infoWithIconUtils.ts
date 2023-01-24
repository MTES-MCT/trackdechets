import { InfoIconCode, InfoIconValue } from "./infoWithIconTypes";

export const getLabelValue = (code: InfoIconCode): InfoIconValue => {
  switch (code) {
    case InfoIconCode.TempStorage:
      return InfoIconValue.TempStorage;
    case InfoIconCode.EcoOrganism:
      return InfoIconValue.EcoOrganism;
    case InfoIconCode.LastModificationDate:
      return InfoIconValue.LastModificationDate;
    default:
      return InfoIconValue.default;
  }
};
