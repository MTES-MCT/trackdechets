import {
  BsffOperationCode,
  BsffOperationQualification,
  BsffPackagingType
} from "../generated/graphql/types";

export const OPERATION_CODES: Record<BsffOperationCode, string> = {
  R2: "R 2",
  R12: "R 12",
  D10: "D 10",
  D13: "D 13",
  D14: "D 14"
};

export const OPERATION_QUALIFICATIONS: Record<
  BsffOperationQualification,
  string
> = {
  INCINERATION: "INCINERATION",
  RECONDITIONNEMENT: "RECONDITIONNEMENT",
  RECUPERATION_REGENERATION: "RECUPERATION_REGENERATION",
  REEXPEDITION: "REEXPEDITION",
  GROUPEMENT: "GROUPEMENT"
};

export const WASTE_CODES = ["14 06 01*"];

export const PACKAGING_TYPE: Record<BsffPackagingType, BsffPackagingType> = {
  BOUTEILLE: "BOUTEILLE"
};
