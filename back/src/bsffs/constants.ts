import { BsffPackagingType } from "../generated/graphql/types";

export const OPERATION_CODES = {
  R2: "R 2",
  R12: "R 12",
  D10: "D 10",
  D13: "D 13",
  D14: "D 14"
};

export const GROUPING_CODES = [
  OPERATION_CODES.R12,
  OPERATION_CODES.D13,
  OPERATION_CODES.D14
];

export const WASTE_CODES = ["14 06 01*"];

export const PACKAGING_TYPE: Record<BsffPackagingType, BsffPackagingType> = {
  BOUTEILLE: "BOUTEILLE"
};
