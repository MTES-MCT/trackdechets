interface ProcessingOperation {
  code: string;
  description: string;
}

const PROCESSING_OPERATIONS_VALORISATION: ProcessingOperation[] = [
  {
    code: "R 1",
    description:
      "Utilisation principale comme combustible ou autre moyen de produire de l'énergie"
  },
  { code: "R 2", description: "Récupération ou régénération des solvants" },
  {
    code: "R 3",
    description:
      "Recyclage ou récupération des substances organiques qui ne sont pas utilisées comme solvants (y compris les opérations de compostage et autres transformations biologiques)"
  },
  {
    code: "R 4",
    description:
      "Recyclage ou récupération des métaux et des composés métalliques"
  },
  {
    code: "R 5",
    description: "Recyclage ou récupération d’autres matières inorganiques"
  },
  { code: "R 6", description: "Régénération des acides ou des bases" },
  {
    code: "R 7",
    description: "Récupération des produits servant à capter les polluants"
  },
  {
    code: "R 8",
    description: "Récupération des produits provenant des catalyseurs"
  },
  {
    code: "R 9",
    description: "Régénération ou autres réemplois des huiles"
  },
  {
    code: "R 10",
    description:
      "Épandage sur le sol au profit de l’agriculture ou de l’écologie"
  },
  {
    code: "R 11",
    description:
      "Utilisation de déchets résiduels obtenus à partir de l'une des opérations numérotées R1 à R10"
  },
  {
    code: "R 12",
    description:
      "Échange de déchets en vue de les soumettre à l'une des opérations numérotées R1 à R11"
  },
  {
    code: "R 13",
    description:
      "Stockage de déchets préalablement à l’une des opérations R1 à R12 (à l’exclusion du stockage temporaire, avant collecte, sur le site de production)."
  }
];

const PROCESSING_OPERATIONS_ELIMINATION: ProcessingOperation[] = [
  {
    code: "D 1",
    description:
      "Dépôt sur ou dans le sol (par exemple, mise en décharge, etc …)"
  },
  {
    code: "D 2",
    description:
      "Traitement en milieu terrestre (par exemple, biodégradation de déchets liquides ou de boues dans les sols, etc …)"
  },
  {
    code: "D 3",
    description:
      "Injection en profondeur (par exemple injection des déchets pompables dans des puits, des dômes de sel ou des failles géologiques naturelles, etc …)"
  },
  {
    code: "D 4",
    description:
      "Lagunage (par exemple, déversement de déchets liquides ou de boues dans des puits, des étangs ou des bassins, etc …)"
  },
  {
    code: "D 5",
    description:
      "Mise en décharge spécialement aménagée (par exemple, placement dans des alvéoles étanches séparées, recouvertes et isolées les unes et les autres et de l’environnement, etc …)"
  },
  {
    code: "D 6",
    description: "Rejet dans le milieu aquatique sauf l’immersion"
  },
  {
    code: "D 7",
    description: "Immersion, y compris enfouissement dans le sous-sol marin"
  },
  {
    code: "D 8",
    description:
      "Traitement biologique non spécifié ailleurs dans la présente liste, aboutissant à des composés ou à des mélanges qui sont éliminés selon l'un des procédés numérotés D1 à D12"
  },
  {
    code: "D 9",
    description:
      "Traitement physico-chimique non spécifié ailleurs dans la présente liste, aboutissant à des composés ou à des mélanges qui sont éliminés selon l'un des procédés numérotés D1 à D12 ( par exemple, évaporation, séchage, calcination, etc …)"
  },
  { code: "D 10", description: "Incinération à terre" },
  {
    code: "D 12",
    description:
      "Stockage permanent (par exemple, placement de conteneurs dans une mine, etc ...)"
  },
  {
    code: "D 13",
    description:
      "Regroupement préalablement à l'une des opérations numérotées D1 à D12"
  },
  {
    code: "D 14",
    description:
      "Reconditionnement préalablement à l’une des opérations numérotées D1 à D13"
  },
  {
    code: "D 15",
    description:
      "Stockage préalablement à l’une des opérations D1 à D14 (à l’exclusion du stockage temporaire, avant collecte, sur le site de production)."
  }
];

export const PROCESSING_OPERATIONS: ProcessingOperation[] = [
  ...PROCESSING_OPERATIONS_VALORISATION,
  ...PROCESSING_OPERATIONS_ELIMINATION
];

export const PROCESSING_OPERATIONS_CODES: string[] = PROCESSING_OPERATIONS.map(
  operation => operation.code
);
