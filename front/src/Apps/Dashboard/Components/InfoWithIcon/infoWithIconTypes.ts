import { Maybe } from "generated/graphql/types";

export enum InfoIconCode {
  TempStorage = "TempStorage",
  EcoOrganism = "EcoOrganism",
  LastModificationDate = "LastModificationDate",
  CustomInfo = "CustomInfo",
  TransporterNumberPlate = "TransporterNumberPlate",
  default = "",
}
export enum InfoIconValue {
  TempStorage = "Entreposage provisoire",
  EcoOrganism = "Éco-organisme",
  LastModificationDate = "Modifié le",
  CustomInfo = "Champ libre",
  TransporterNumberPlate = "Plaque d'immatriculation",
  default = "",
}

export interface InfoWithIconProps {
  labelCode: InfoIconCode;
  date?: string;
  hasEditableInfos?: boolean;
  isDisabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  editableInfos?: {
    customInfo?: string | Maybe<string[]> | string[];
    transporterNumberPlate?: string | Maybe<string[]> | string[];
  };
}
