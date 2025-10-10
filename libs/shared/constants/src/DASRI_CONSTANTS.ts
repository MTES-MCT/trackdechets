export enum DasriProcessingOperationType {
  Incineration = "INCINERATION",
  IncinerationValorisation = "INCINERATIONVALORISATION",
  Pretraitement = "PRETRAITEMENT",
  RegroupementPrealableD9D10 = "REGROUPEMENTPREALABLED9D10",
  RegroupementPrealableR1 = "REGROUPEMENTPREALABLEDR1"
}

export const DASRI_WASTE_CODES = [
  {
    code: "18 01 03*",
    description: "DASRI d'origine humaine"
  },
  {
    code: "18 02 02*",
    description: "DASRI d'origine animale"
  }
];

export const DASRI_WASTE_CODES_VALUES = ["18 01 03*", "18 02 02*"] as const;

export const DASRI_WASTE_CODES_MAPPING = DASRI_WASTE_CODES.reduce(
  (acc, item) => ({ ...acc, ...{ [item.code]: item.description } }),
  {}
);
export const DASRI_PROCESSING_OPERATIONS = [
  {
    type: DasriProcessingOperationType.Pretraitement,
    code: "D9F",
    description: "Prétraitement par désinfection  - Banaliseur"
  },
  {
    type: DasriProcessingOperationType.Incineration,
    code: "D10",
    description: "Incinération"
  },
  {
    type: DasriProcessingOperationType.IncinerationValorisation,
    code: "R1",
    description: "Incinération + valorisation énergétique"
  }
];

export const DASRI_GROUPING_OPERATIONS = [
  {
    type: DasriProcessingOperationType.RegroupementPrealableD9D10,
    code: "D13",
    description:
      "Groupement avant désinfection en D9 ou incinération en D10 sur un site relevant de la rubrique 2718"
  },
  {
    type: DasriProcessingOperationType.RegroupementPrealableR1,
    code: "R12",
    description:
      "Groupement avant incinération en R1, sur un site relevant de la rubrique 2718"
  }
];

export const DASRI_GROUPING_OPERATIONS_CODES = DASRI_GROUPING_OPERATIONS.map(
  operation => operation.code
);

export const DASRI_PROCESSING_OPERATIONS_CODES =
  DASRI_PROCESSING_OPERATIONS.map(operation => operation.code);

export const DASRI_ALL_OPERATIONS_CODES = [
  ...DASRI_PROCESSING_OPERATIONS_CODES,
  ...DASRI_GROUPING_OPERATIONS_CODES
] as [string, ...string[]];
