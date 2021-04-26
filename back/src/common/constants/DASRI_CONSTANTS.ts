enum DasriProcessingOperationType {
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
    code: "18 01 02*",
    description: "DASRI d'origine animale"
  }
];
export const DASRI_PROCESSING_OPERATIONS = [
  {
    type: DasriProcessingOperationType.Pretraitement,
    code: "D9",
    description: "Prétraitement par désinfection"
  },
  {
    type: DasriProcessingOperationType.Incineration,
    code: "D10",
    description: "DASRI d'origine humaine"
  },
  {
    type: DasriProcessingOperationType.IncinerationValorisation,
    code: "R1",
    description: "DASRI d'origine animale"
  }
];

export const DASRI_GROUPING_OPERATIONS = [
  {
    type: DasriProcessingOperationType.RegroupementPrealableD9D10,
    code: "D12",
    description: "Regroupement D12 Préalable à D9 ou D10"
  },
  {
    type: DasriProcessingOperationType.RegroupementPrealableR1,
    code: "R12",
    description: "Regroupement R12 Préalable à R1"
  }
];

export const DASRI_GROUPING_OPERATIONS_CODES: string[] = DASRI_GROUPING_OPERATIONS.map(
  operation => operation.code
);

export const DASRI_PROCESSING_OPERATIONS_CODES: string[] = DASRI_PROCESSING_OPERATIONS.map(
  operation => operation.code
);
export const DASRI_ALL_OPERATIONS_CODES: string[] = [
  ...DASRI_PROCESSING_OPERATIONS_CODES,
  ...DASRI_GROUPING_OPERATIONS_CODES
];
