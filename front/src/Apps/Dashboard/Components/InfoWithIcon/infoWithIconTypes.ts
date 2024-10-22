import { Maybe } from "@td/codegen-ui";

export enum InfoIconCode {
  TempStorage = "TempStorage",
  EcoOrganism = "EcoOrganism",
  LastModificationDate = "LastModificationDate",
  CustomInfo = "CustomInfo",
  TransporterNumberPlate = "TransporterNumberPlate",
  PickupSite = "PickupSite",
  CustomId = "CustomId",
  Cap = "Cap",
  default = ""
}
export enum InfoIconValue {
  TempStorage = "Entreposage provisoire",
  LastModificationDate = "Modifié le",
  CustomInfo = "Champ libre",
  PickupSite = "Adresse chantier",
  CustomId = "N° libre : ",
  Cap = "CAP : ",
  default = ""
}

export interface InfoWithIconProps {
  labelCode: InfoIconCode;
  info?: string;
  hasEditableInfos?: boolean;
  isDisabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  editableInfos?: {
    customInfo?: string | Maybe<string[]> | string[];
    transporterNumberPlate?: string | Maybe<string[]> | string[];
  };
}
