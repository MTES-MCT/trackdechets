export enum ProcessingOperationType {
  Eliminiation = "ELIMINIATION",
  Valorisation = "VALORISATION",
  Groupement = "GROUPEMENT"
}

export const PROCESSING_OPERATIONS = [
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 1",
    description:
      "Utilisation principale comme combustible ou autre moyen de produire de l'énergie"
  },
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 2",
    description: "Récupération ou régénération des solvants"
  },
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 3",
    description:
      "Recyclage ou récupération des substances organiques qui ne sont pas utilisées comme solvants (y compris les opérations de compostage et autres transformations biologiques)"
  },
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 4",
    description:
      "Recyclage ou récupération des métaux et des composés métalliques"
  },
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 5",
    description: "Recyclage ou récupération d’autres matières inorganiques"
  },
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 6",
    description: "Régénération des acides ou des bases"
  },
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 7",
    description: "Récupération des produits servant à capter les polluants"
  },
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 8",
    description: "Récupération des produits provenant des catalyseurs"
  },
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 9",
    description: "Régénération ou autres réemplois des huiles"
  },
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 10",
    description:
      "Épandage sur le sol au profit de l’agriculture ou de l’écologie"
  },
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 11",
    description:
      "Utilisation de déchets résiduels obtenus à partir de l'une des opérations numérotées R1 à R10"
  },
  {
    type: ProcessingOperationType.Groupement,
    code: "R 12",
    description:
      "Échange de déchets en vue de les soumettre à l'une des opérations numérotées R1 à R11"
  },
  {
    type: ProcessingOperationType.Groupement,
    code: "R 13",
    description:
      "Stockage de déchets préalablement à l’une des opérations R1 à R12 (à l’exclusion du stockage temporaire, avant collecte, sur le site de production)."
  },
  {
    type: ProcessingOperationType.Eliminiation,
    code: "D 1",
    description:
      "Dépôt sur ou dans le sol (par exemple, mise en décharge, etc …)"
  },
  {
    type: ProcessingOperationType.Eliminiation,
    code: "D 2",
    description:
      "Traitement en milieu terrestre (par exemple, biodégradation de déchets liquides ou de boues dans les sols, etc …)"
  },
  {
    type: ProcessingOperationType.Eliminiation,
    code: "D 3",
    description:
      "Injection en profondeur (par exemple injection des déchets pompables dans des puits, des dômes de sel ou des failles géologiques naturelles, etc …)"
  },
  {
    type: ProcessingOperationType.Eliminiation,
    code: "D 4",
    description:
      "Lagunage (par exemple, déversement de déchets liquides ou de boues dans des puits, des étangs ou des bassins, etc …)"
  },
  {
    type: ProcessingOperationType.Eliminiation,
    code: "D 5",
    description:
      "Mise en décharge spécialement aménagée (par exemple, placement dans des alvéoles étanches séparées, recouvertes et isolées les unes et les autres et de l’environnement, etc …)"
  },
  {
    type: ProcessingOperationType.Eliminiation,
    code: "D 6",
    description: "Rejet dans le milieu aquatique sauf l’immersion"
  },
  {
    type: ProcessingOperationType.Eliminiation,
    code: "D 7",
    description: "Immersion, y compris enfouissement dans le sous-sol marin"
  },
  {
    type: ProcessingOperationType.Eliminiation,
    code: "D 8",
    description:
      "Traitement biologique non spécifié ailleurs dans la présente liste, aboutissant à des composés ou à des mélanges qui sont éliminés selon l'un des procédés numérotés D1 à D12"
  },
  {
    type: ProcessingOperationType.Groupement,
    code: "D 9",
    description:
      "Traitement physico-chimique non spécifié ailleurs dans la présente liste, aboutissant à des composés ou à des mélanges qui sont éliminés selon l'un des procédés numérotés D1 à D12 ( par exemple, évaporation, séchage, calcination, etc …)"
  },
  {
    type: ProcessingOperationType.Eliminiation,
    code: "D 9 F",
    description:
      "(final) Traitement physico-chimique non spécifié ailleurs dans la présente liste, aboutissant à des composés ou à des mélanges qui sont éliminés selon l'un des procédés numérotés D1 à D12 ( par exemple, évaporation, séchage, calcination, etc …)"
  },
  {
    type: ProcessingOperationType.Eliminiation,
    code: "D 10",
    description: "Incinération à terre"
  },
  {
    type: ProcessingOperationType.Eliminiation,
    code: "D 12",
    description:
      "Stockage permanent (par exemple, placement de conteneurs dans une mine, etc ...)"
  },
  {
    type: ProcessingOperationType.Groupement,
    code: "D 13",
    description:
      "Regroupement préalablement à l'une des opérations numérotées D1 à D12"
  },
  {
    type: ProcessingOperationType.Groupement,
    code: "D 14",
    description:
      "Reconditionnement préalablement à l’une des opérations numérotées D1 à D13"
  },
  {
    type: ProcessingOperationType.Groupement,
    code: "D 15",
    description:
      "Stockage préalablement à l’une des opérations D1 à D14 (à l’exclusion du stockage temporaire, avant collecte, sur le site de production)."
  }
] as const;

export const PROCESSING_OPERATIONS_CODES = PROCESSING_OPERATIONS.map(
  operation => operation.code
);

type OperationCode = (typeof PROCESSING_OPERATIONS_CODES)[number];
export type TdOperationCode = OperationCode | "R 0";
export type TdOperationCodeEnum = Readonly<
  [TdOperationCode, ...TdOperationCode[]]
>;

// Build an object that zods nativeEnum can ingest
export const PROCESSING_OPERATIONS_CODES_NATIVE_ENUM =
  PROCESSING_OPERATIONS_CODES.reduce((obj, cur) => {
    obj[cur] = cur;
    return obj;
  }, {} as Record<OperationCode, OperationCode>);

export const PROCESSING_OPERATIONS_GROUPEMENT_CODES: string[] =
  PROCESSING_OPERATIONS.filter(
    operation => operation.type === ProcessingOperationType.Groupement
  ).map(operation => operation.code);

export const PROCESSING_OPERATIONS_CODES_ENUM: TdOperationCodeEnum = [
  "R 1",
  "R 2",
  "R 3",
  "R 4",
  "R 5",
  "R 6",
  "R 7",
  "R 8",
  "R 9",
  "R 10",
  "R 11",
  "R 12",
  "R 13",
  "D 1",
  "D 2",
  "D 3",
  "D 4",
  "D 5",
  "D 6",
  "D 7",
  "D 8",
  "D 9",
  "D 9 F",
  "D 10",
  "D 12",
  "D 13",
  "D 14",
  "D 15"
];

export const ALL_TD_PROCESSING_OPERATIONS_CODES: TdOperationCodeEnum = [
  "R 0",
  ...PROCESSING_OPERATIONS_CODES_ENUM
];

export const INCOMING_WASTE_PROCESSING_OPERATIONS_CODES: TdOperationCodeEnum = [
  "D 1",
  "D 3",
  "D 4",
  "D 5",
  "D 8",
  "D 9",
  "D 10",
  "D 12",
  "D 13",
  "D 14",
  "D 15",
  "R 1",
  "R 2",
  "R 3",
  "R 4",
  "R 5",
  "R 6",
  "R 7",
  "R 8",
  "R 9",
  "R 10",
  "R 11",
  "R 12",
  "R 13"
];

export const INCOMING_TEXS_PROCESSING_OPERATIONS_CODES: TdOperationCodeEnum = [
  "D 1",
  "D 4",
  "D 5",
  "D 8",
  "D 9",
  "D 10",
  "D 12",
  "D 13",
  "D 14",
  "D 15",
  "R 1",
  "R 2",
  "R 3",
  "R 5",
  "R 10",
  "R 11",
  "R 12",
  "R 13"
];

export const SSD_PROCESSING_OPERATIONS_CODES: TdOperationCodeEnum = [
  "R 2",
  "R 3",
  "R 4",
  "R 5",
  "R 6",
  "R 7",
  "R 8",
  "R 12",
  "R 13"
];
