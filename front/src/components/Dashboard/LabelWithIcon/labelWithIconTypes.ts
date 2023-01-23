export enum LabelIconCode {
  TempStorage = "TempStorage",
  EcoOrganism = "EcoOrganism",
  LastModificationDate = "LastModificationDate",
  default = "",
}
export enum LabelIconValue {
  TempStorage = "Entreposage provisoire",
  EcoOrganism = "Éco-organisme",
  LastModificationDate = "Dernière modification le",
  default = "",
}

export interface LabelWithIconProps {
  labelCode: LabelIconCode;
  date?: string;
}
