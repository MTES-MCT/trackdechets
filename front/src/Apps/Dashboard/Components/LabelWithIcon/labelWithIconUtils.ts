import { LabelIconCode, LabelIconValue } from "./labelWithIconTypes";

export const getLabelValue = (code: LabelIconCode): LabelIconValue => {
  switch (code) {
    case LabelIconCode.TempStorage:
      return LabelIconValue.TempStorage;
    case LabelIconCode.EcoOrganism:
      return LabelIconValue.EcoOrganism;
    case LabelIconCode.LastModificationDate:
      return LabelIconValue.LastModificationDate;
    default:
      return LabelIconValue.default;
  }
};
