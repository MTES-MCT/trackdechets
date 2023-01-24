export enum InfoIconCode {
  TempStorage = "TempStorage",
  EcoOrganism = "EcoOrganism",
  LastModificationDate = "LastModificationDate",
  default = "",
}
export enum InfoIconValue {
  TempStorage = "Entreposage provisoire",
  EcoOrganism = "Éco-organisme",
  LastModificationDate = "Dernière modification le",
  default = "",
}

export interface InfoWithIconProps {
  labelCode: InfoIconCode;
  date?: string;
}
