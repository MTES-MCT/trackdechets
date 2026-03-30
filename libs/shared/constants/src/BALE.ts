export const WASTE_CODES_BALE = [
  "A1010",
  "A1020",
  "A1030",
  "A1040",
  "A1050",
  "A1060",
  "A1070",
  "A1080",
  "A1090",
  "A1100",
  "A1110",
  "A1120",
  "A1130",
  "A1140",
  "A1150",
  "A1160",
  "A1170",
  "A1180",
  "A1190",
  "A2010",
  "A2020",
  "A2030",
  "A2040",
  "A2050",
  "A2060",
  "A3010",
  "A3020",
  "A3030",
  "A3040",
  "A3050",
  "A3060",
  "A3070",
  "A3080",
  "A3090",
  "A3100",
  "A3110",
  "A3120",
  "A3130",
  "A3140",
  "A3150",
  "A3160",
  "A3170",
  "A3180",
  "A3190",
  "A3200",
  "A4010",
  "A4020",
  "A4030",
  "A4040",
  "A4050",
  "A4060",
  "A4070",
  "A4080",
  "A4090",
  "A4100",
  "A4110",
  "A4120",
  "A4130",
  "A4140",
  "A4150",
  "A4160",
  "B1010",
  "B1020",
  "B1030",
  "B1031",
  "B1040",
  "B1050",
  "B1060",
  "B1070",
  "B1080",
  "B1090",
  "B1100",
  "B1110",
  "B1115",
  "B1120",
  "B1130",
  "B1140",
  "B1150",
  "B1160",
  "B1170",
  "B1180",
  "B1190",
  "B1200",
  "B1210",
  "B1220",
  "B1230",
  "B1240",
  "B1250",
  "B2010",
  "B2020",
  "B2030",
  "B2040",
  "B2050",
  "B2060",
  "B2070",
  "B2080",
  "B2090",
  "B2100",
  "B2110",
  "B2120",
  "B2130",
  "B3010",
  "B3020",
  "B3026",
  "B3027",
  "B3030",
  "B3035",
  "B3040",
  "B3050",
  "B3060",
  "B3065",
  "B3070",
  "B3080",
  "B3090",
  "B3100",
  "B3110",
  "B3120",
  "B3130",
  "B3140",
  "B4010",
  "B4020",
  "B4030"
] as const;

export type BaleCodeNode = Readonly<{
  code: string;
  description: string;
  children: readonly BaleCodeNode[];
}>;

export const BALE_CATEGORY_DESCRIPTIONS = {
  A1: "DÉCHETS DE MÉTAUX ET DÉCHETS CONTENANT DES MÉTAUX",
  A2: "DÉCHETS AYANT PRINCIPALEMENT DES CONSTITUANTS INORGANIQUES ET POUVANT CONTENIR DES MÉTAUX ET DES MATIÈRES ORGANIQUES",
  A3: "DÉCHETS AYANT PRINCIPALEMENT DES CONSTITUANTS ORGANIQUES, ET POUVANT CONTENIR DES MÉTAUX ET DES MATIÈRES INORGANIQUES",
  A4: "DÉCHETS POUVANT CONTENIR DES CONSTITUANTS INORGANIQUES OU ORGANIQUES",
  B1: "DÉCHETS DE MÉTAUX ET DÉCHETS CONTENANT DES MÉTAUX",
  B2: "DÉCHETS AYANT PRINCIPALEMENT DES CONSTITUANTS INORGANIQUES POUVANT CONTENIR DES MÉTAUX ET DES MATIÈRES ORGANIQUES",
  B3: "DÉCHETS AYANT PRINCIPALEMENT DES CONSTITUANTS ORGANIQUES POUVANT CONTENIR DES MÉTAUX ET DES MATIÈRES INORGANIQUES",
  B4: "DÉCHETS POUVANT CONTENIR DES CONSTITUANTS INORGANIQUES OU ORGANIQUES"
} as const;

export type BaleCategoryCode = keyof typeof BALE_CATEGORY_DESCRIPTIONS;

export const WASTE_CODES_TREE = [
  {
    code: "A1",
    description: "DÉCHETS DE MÉTAUX ET DÉCHETS CONTENANT DES MÉTAUX",
    children: [
      {
        code: "A1010",
        description:
          "Déchets métalliques et déchets constitués d'alliages d'un ou plusieurs des métaux suivants :\n- antimoine ;\n- arsenic ;\n- béryllium ;\n- cadmium ;\n- plomb ;\n- mercure ;\n- sélénium ;\n- tellure ;\n- thallium,\nà l'exclusion des déchets de ce type inscrits sur la liste B.",
        children: []
      },
      {
        code: "A1020",
        description:
          "Déchets ayant pour éléments constituants ou contaminants, à l'exclusion des déchets métalliques sous forme solide, une ou plusieurs des matières suivantes :\n- antimoine ; composés de l'antimoine ;\n- béryllium ; composés du béryllium ;\n- cadmium ; composés du cadmium ;\n- plomb ; composés du plomb ;\n- sélénium ; composés du sélénium ;\n- tellure ; composés du tellure.",
        children: []
      },
      {
        code: "A1030",
        description:
          "Déchets ayant comme éléments constituants ou contaminants :\n- arsenic ; composés de l'arsenic ;\n- mercure ; composés du mercure ;\n- thallium ; composés du thallium.",
        children: []
      },
      {
        code: "A1040",
        description:
          "Déchets ayant comme constituants :\n- métaux carbonyles ;\n- composés du chrome hexavalent.",
        children: []
      },
      {
        code: "A1050",
        description: "Boues de galvanisation ;",
        children: []
      },
      {
        code: "A1060",
        description: "Liqueurs provenant du décapage des métaux.",
        children: []
      },
      {
        code: "A1070",
        description:
          "Résidus de lixiviation du traitement du zinc, poussières et boues telles que jarosite, hématite, etc.",
        children: []
      },
      {
        code: "A1080",
        description:
          "Déchets de zinc ne figurant pas sur la liste B et contenant des concentrations de plomb et de cadmium suffisantes pour qu'ils possèdent les caractéristiques de l'annexe III.",
        children: []
      },
      {
        code: "A1090",
        description:
          "Cendres issues de l'incinération de fils de cuivre isolés.",
        children: []
      },
      {
        code: "A1100",
        description:
          "Poussières et résidus provenant des systèmes de dépoussiérage des fonderies de cuivre.",
        children: []
      },
      {
        code: "A1110",
        description:
          "Solutions électrolytiques épuisées provenant d'opérations d'électro-extraction du cuivre.",
        children: []
      },
      {
        code: "A1120",
        description:
          "Boues résiduaires, à l'exclusion des boues anodiques, provenant des systèmes d'épuration dans les opérations d'électro-extraction du cuivre.",
        children: []
      },
      {
        code: "A1130",
        description: "Solutions de décapage contenant du cuivre dissout.",
        children: []
      },
      {
        code: "A1140",
        description:
          "Déchets de catalyseurs à base de chlorure et de cyanure de cuivre.",
        children: []
      },
      {
        code: "A1150",
        description:
          "Cendres de métaux précieux provenant de l'incinération de circuits imprimés ne figurant pas sur la liste B (1).",
        children: []
      },
      {
        code: "A1160",
        description:
          "Déchets d'accumulateurs électriques au plomb et à l'acide, entiers ou concassés.",
        children: []
      },
      {
        code: "A1170",
        description:
          "Accumulateurs et batteries usagés autres que ceux contenant le mélange spécifié sur la liste B. Accumulateurs usagés ne figurant pas sur la liste B et contenant des constituants mentionnés à l'annexe I dans une proportion qui les rend dangereux.",
        children: []
      },
      {
        code: "A1180",
        description:
          "Assemblages électriques et électroniques usagés ou sous forme de débris (2) contenant des éléments tels que les accumulateurs et autres batteries mentionnés sur la liste A, les rupteurs à mercure, les verres provenant de tubes à rayons cathodiques et d'autres verres activés et condensateurs à PCB, ou contaminés par les constituants cités à l'annexe I (cadmium, mercure, plomb, biphényles polychlorés, etc.) dans une proportion telle qu'ils puissent posséder l'une quelconque des caractéristiques citées à l'annexe III (voir rubrique correspondante de la liste B [B1110]) (3).",
        children: []
      },
      {
        code: "A1190",
        description: "",
        children: []
      }
    ]
  },
  {
    code: "A2",
    description:
      "DÉCHETS AYANT PRINCIPALEMENT DES CONSTITUANTS INORGANIQUES ET POUVANT CONTENIR DES MÉTAUX ET DES MATIÈRES ORGANIQUES",
    children: [
      {
        code: "A2010",
        description:
          "Débris de verre provenant de tubes cathodiques et d'autres verres activés.",
        children: []
      },
      {
        code: "A2020",
        description:
          "Déchets de composés inorganiques du fluor sous forme de liquides ou de boues à l'exclusion de ceux figurant sur la liste B.",
        children: []
      },
      {
        code: "A2030",
        description:
          "Catalyseurs usagés, à l'exclusion de ceux figurant sur la liste B.",
        children: []
      },
      {
        code: "A2040",
        description:
          "Déchets de gypse provenant de traitements chimiques industriels contenant des constituants cités à l'annexe I dans une proportion telle qu'ils puissent posséder l'une des caractéristiques de danger énumérées à l'annexe III (voir rubrique correspondante de la liste B [B2080]).",
        children: []
      },
      {
        code: "A2050",
        description: "Déchets d'amiante (poussières et fibres).",
        children: []
      },
      {
        code: "A2060",
        description:
          "Cendres volantes de centrales électriques alimentées au charbon contenant des substances citées à l'annexe I à des concentrations suffisantes pour qu'elles possèdent l'une des caractéristiques énumérées à l'annexe III (voir rubrique correspondante de la liste B [B2050]).",
        children: []
      }
    ]
  },
  {
    code: "A3",
    description:
      "DÉCHETS AYANT PRINCIPALEMENT DES CONSTITUANTS ORGANIQUES, ET POUVANT CONTENIR DES MÉTAUX ET DES MATIÈRES INORGANIQUES",
    children: [
      {
        code: "A3010",
        description:
          "Résidus de la production ou du traitement du coke et du bitume de pétrole.",
        children: []
      },
      {
        code: "A3020",
        description:
          "Déchets d'huiles minérales impropres à l'usage initialement prévu.",
        children: []
      },
      {
        code: "A3030",
        description:
          "Déchets contenant, consistant en, ou contaminés par des boues de composés antidétonants au plomb.",
        children: []
      },
      {
        code: "A3040",
        description: "Fluides thermiques (transfert calorifique).",
        children: []
      },
      {
        code: "A3050",
        description:
          "Déchets issus de la production, de la préparation et de l'utilisation de résines, de latex, de plastifiants ou de colles et adhésifs, à l'exclusion de ceux mentionnés sur la liste B (voir rubrique correspondante de la liste B [B4020]).",
        children: []
      },
      {
        code: "A3060",
        description: "Déchets contenant de la nitrocellulose.",
        children: []
      },
      {
        code: "A3070",
        description:
          "Phénols et composés phénolés, y compris les chlorophénols, sous forme de liquides ou de boues.",
        children: []
      },
      {
        code: "A3080",
        description:
          "Ethers usés, à l'exclusion de ceux inscrits sur la liste B.",
        children: []
      },
      {
        code: "A3090",
        description:
          "Sciures, cendres, boues et farines de cuir contenant des composés de chrome hexavalent ou des biocides (voir rubrique correspondante de la liste B [B3100]).",
        children: []
      },
      {
        code: "A3100",
        description:
          "Rognures et autres déchets de cuir et de peau préparés ou de cuir reconstitué, non utilisables pour la fabrication d'ouvrages en cuir, contenant des composés de chrome hexavalent ou des biocides (voir rubrique correspondante de la liste B [B3090]).",
        children: []
      },
      {
        code: "A3110",
        description:
          "Déchets issus des opérations de pelleterie contenant des composés de chrome hexavalent, des biocides ou des substances infectieuses (voir rubrique correspondante de la liste B [B3110]).",
        children: []
      },
      {
        code: "A3120",
        description:
          "Résidus de broyage automobile (fraction légère : peluche, étoffe, déchets de plastique, etc.).",
        children: []
      },
      {
        code: "A3130",
        description: "Composés organiques du phosphore.",
        children: []
      },
      {
        code: "A3140",
        description:
          "Solvants organiques non halogénés, autres que ceux spécifiés sur la liste B.",
        children: []
      },
      {
        code: "A3150",
        description: "Solvants organiques halogénés.",
        children: []
      },
      {
        code: "A3160",
        description:
          "Résidus de distillation non aqueux, halogénés ou non halogénés, issus d'opérations de récupération de solvants organiques.",
        children: []
      },
      {
        code: "A3170",
        description:
          "Déchets issus de la production d'hydrocarbures aliphatiques halogénés (tels que le chlorométhane, le dichloréthane, le chlorure de vinyle, le chlorure de vinylidène, le chlorure d'allyle et l'épichlorhydrine).",
        children: []
      },
      {
        code: "A3180",
        description:
          "Déchets contenant, consistant en, ou contaminés par des biphényles polychlorés (PCB), des terphényles polychlorés (PCT), du naphtalène polychloré (PCN) ou des biphényles polybromés (PBB), y compris tout composé polybromé analogue ayant une concentration égale ou supérieure à 50 mg/kg (4).",
        children: []
      },
      {
        code: "A3190",
        description:
          "Déchets bitumineux (à l'exclusion des ciments asphaltiques) provenant du raffinage, de la distillation et de tout traitement pyrolitique de matières organiques.",
        children: []
      },
      {
        code: "A3200",
        description: "",
        children: []
      }
    ]
  },
  {
    code: "A4",
    description:
      "DÉCHETS POUVANT CONTENIR DES CONSTITUANTS INORGANIQUES OU ORGANIQUES",
    children: [
      {
        code: "A4010",
        description:
          "Déchets issus de la production, de la préparation et de l'utilisation de produits pharmaceutiques, à l'exclusion de ceux inscrits sur la liste B.",
        children: []
      },
      {
        code: "A4020",
        description:
          "Déchets cliniques provenant de soins médicaux, infirmiers, dentaires et vétérinaires, ou d'autres pratiques analogues, et déchets issus des opérations d'examen et de traitement de patients dans les hôpitaux et établissements apparentés, ou des travaux de recherche.",
        children: []
      },
      {
        code: "A4030",
        description:
          "Déchets issus de la production, de la préparation et de l'utilisation de biocides et de produits phytopharmaceutiques, y compris les rejets de pesticides et d'herbicides non conformes aux spécifications, périmés ou impropres à l'usage initialement prévu.",
        children: []
      },
      {
        code: "A4040",
        description:
          "Déchets issus de la fabrication, de la préparation et de l'utilisation de produits chimiques destinés à la préservation du bois (6).",
        children: []
      },
      {
        code: "A4050",
        description:
          "Déchets contenant, consistant en, ou contaminés par l'une des substances suivantes :\n- cyanures inorganiques, exceptés les résidus de métaux précieux sous forme solide contenant des traces de cyanures inorganiques ;\n- cyanures organiques.",
        children: []
      },
      {
        code: "A4060",
        description: "Mélanges et émulsions huile/eau ou hydrocarbure/eau.",
        children: []
      },
      {
        code: "A4070",
        description:
          "Déchets issus de la production, de la préparation et de l'utilisation d'encres, de colorants, de pigments, de peintures, de laques ou de vernis, exceptés ceux qui figurent sur la liste B (voir rubrique correspondante de la liste B [B4010]).",
        children: []
      },
      {
        code: "A4080",
        description:
          "Déchets à caractère explosible (à l'exclusion de ceux qui figurent sur la liste B).",
        children: []
      },
      {
        code: "A4090",
        description:
          "Solutions acides ou basiques, autres que celles qui figurent dans la rubrique correspondante de la liste B [B2120]).",
        children: []
      },
      {
        code: "A4100",
        description:
          "Déchets provenant des installations industrielles antipollution d'épuration des rejets gazeux, à l'exception de ceux qui figurent sur la liste B.",
        children: []
      },
      {
        code: "A4110",
        description:
          "Déchets contenant, consistant en, ou contaminés par l'une des substances suivantes :\n- tout produit de la famille des dibenzofuranes polychlorés ;\n- tout produit de la famille des dibenzoparadioxines polychlorées.",
        children: []
      },
      {
        code: "A4120",
        description:
          "Déchets contenant, consistant en, ou contaminés par des peroxydes.",
        children: []
      },
      {
        code: "A4130",
        description:
          "Conditionnements et emballages usés contenant des substances de l'annexe I à des concentrations suffisantes pour qu'ils présentent des caractéristiques de danger figurant à l'annexe III.",
        children: []
      },
      {
        code: "A4140",
        description:
          "Déchets consistant en, ou contenant des produits chimiques non conformes aux spécifications ou périmés (7), appartenant aux catégories de l'annexe I et ayant les caractéristiques de danger figurant à l'annexe III.",
        children: []
      },
      {
        code: "A4150",
        description:
          "Déchets de substances chimiques provenant d'activités de recherche-développement ou d'enseignement, non identifiés et/ou nouveaux et dont les effets sur l'homme et/ou sur l'environnement ne sont pas connus.",
        children: []
      },
      {
        code: "A4160",
        description:
          "Déchets contenant du carbone actif usé ne figurant pas sur la liste B (voir rubrique correspondante de la liste B [B2060]).",
        children: []
      }
    ]
  },
  {
    code: "B1",
    description: "DÉCHETS DE MÉTAUX ET DÉCHETS CONTENANT DES MÉTAUX",
    children: [
      {
        code: "B1010",
        description:
          "Déchets de métaux et de leurs alliages sous forme métallique, non susceptible de dispersion :\n- métaux précieux (or, argent, groupe du platine, le mercure étant exclu) ;\n- déchets de fer et d'acier ;\n- déchets de cuivre ;\n- déchets de nickel ;\n- déchets d'aluminium ;\n- déchets de zinc ;\n- déchets d'étain ;\n- déchets de tungstène ;\n- déchets de molybdène ;\n- déchets de tantale ;\n- déchets de magnésium ;\n- déchets de cobalt ;\n- déchets de bismuth ;\n- déchets de titane ;\n- déchets de zirconium ;\n- déchets de manganèse ;\n- déchets de germanium ;\n- déchets de vanadium ;\n- déchets de hafnium, indium, niobium, rhénium et gallium ;\n- déchets de thorium ;\n- déchets de terres rares.",
        children: []
      },
      {
        code: "B1020",
        description:
          "Débris purs et non contaminés des métaux suivants, y compris leurs alliages, sous forme finie (lames, plaques, poutres, tiges, etc.) :\n- antimoine ;\n- béryllium ;\n- cadmium ;\n- plomb (à l'exclusion des accumulateurs électriques au plomb et à l'acide) ;\n- sélénium ;\n- tellurium.",
        children: []
      },
      {
        code: "B1030",
        description: "Métaux réfractaires contenant des résidus.",
        children: []
      },
      {
        code: "B1031",
        description: "",
        children: []
      },
      {
        code: "B1040",
        description:
          "Débris agglomérés provenant de la production de l'énergie électrique et non contaminés par les huiles lubrifiantes, les PCB ou les PCT au point de devenir dangereux.",
        children: []
      },
      {
        code: "B1050",
        description:
          "Mélanges de résidus métalliques non ferreux (fractions lourdes) ne contenant pas de matières de l'annexe I à des concentrations telles qu'ils puissent avoir les caractéristiques de danger figurant à l'annexe III (8).",
        children: []
      },
      {
        code: "B1060",
        description:
          "Résidus de sélénium et de tellurium sous forme métallique élémentaire, y compris les poudres.",
        children: []
      },
      {
        code: "B1070",
        description:
          "Résidus de cuivre et d'alliages cuivreux sous forme susceptible de dispersion, sauf s'ils contiennent des matières de l'annexe I à des concentrations telles qu'ils puissent avoir les caractéristiques de danger figurant à l'annexe III.",
        children: []
      },
      {
        code: "B1080",
        description:
          "Cendres et résidus de zinc, y compris résidus d'alliages de zinc sous forme susceptible de dispersion, sauf s'ils contiennent des constituants de l'annexe I à des concentrations telles qu'ils puissent avoir la caractéristique de danger H4.3 figurant à l'annexe III (9).",
        children: []
      },
      {
        code: "B1090",
        description:
          "Accumulateurs électriques usagés répondant à certaines spécifications, à l'exception de ceux qui contiennent du plomb, du cadmium ou du mercure.",
        children: []
      },
      {
        code: "B1100",
        description:
          "Déchets contenant des métaux et issus des opérations de fusion, de fonte et d'affinage des métaux :\n- mattes de galvanisation ;\n- écumes et laitiers de zinc ;\n- mattes de surface de la galvanisation (>90 % Zn) :\n- mattes de fonds de la galvanisation (>92 % Zn) ;\n- laitiers de fonderie sous pression (>85 % Zn) ;\n- laitiers provenant de la galvanisation à chaud (procédé discontinu) (>92 % Zn) ;\n- résidus provenant de l'écumage du zinc ;\n- résidus provenant de l'écumage de l'aluminium, à l'exclusion de ceux contenant du sel ;\n- scories provenant du traitement du cuivre et destinées à une récupération ultérieure ne contenant pas d'arsenic, de plomb, ni de cadmium, au point de répondre aux caractéristiques de danger figurant à l'annexe III ;\n- dépôts réfractaires, y compris les creusets, issus de la fonte du cuivre ;\n- scories provenant du traitement des métaux précieux et destinées à un affinage ultérieur ;\n- scories d'étain contenant du tantale, contenant moins de 0,5 % d'étain.",
        children: []
      },
      {
        code: "B1110",
        description:
          "Assemblages électriques et électroniques :\n- assemblages électriques constitués uniquement de métaux ou d'alliages de métaux ;\n- assemblages électriques et électroniques usagés ou déchets (10) (y compris les circuits imprimés) ne contenant pas d'éléments tels que les accumulateurs et autres batteries mentionnés sur la liste A, les rupteurs à mercure, les verres provenant de tubes à rayons cathodiques et d'autres verres activés et condensateurs à PCB, ou non contaminés par les constituants cités à l'annexe I (cadmium, mercure, plomb, biphényles polychlorés, etc.) ou débarrassés de ces substances, au point de ne posséder aucune des caractéristiques figurant à l'annexe III (voir rubrique correspondante de la liste A [A1180]) ;\n- assemblages électriques et électroniques (y compris circuits imprimés, composants et fils électriques) destinés à une réutilisation directe (11) et non au recyclage ou à l'élimination définitive (12).",
        children: []
      },
      {
        code: "B1115",
        description: "",
        children: []
      },
      {
        code: "B1120",
        description:
          "Catalyseurs usagés, à l'exclusion des liquides utilisés comme catalyseurs, contenant l'une quelconque des substances suivantes :\nMétaux de transition, à l'exclusion des déchets de catalyseurs (catalyseurs usés, catalyseurs liquides ou autres) usagés de la liste A :\n- scandium\n- vanadium\n- manganèse\n- cobalt\n- cuivre\n- yttrium\n- niobum\n- hafnium\n- tungstène\n- titane\n- chrome\n- fer\n- nickel\n- zinc\n- zirconium\n- molybdène\n- tantale\n- rhénium\n- Lanthanides (métaux du groupe des terres rares) :\n- lanthane\n- praséodyme\n- samarium\n- gadolinium\n- dysprosium\n- erbium\n- ytterbium\n- cérium\n- néodyme\n- europium\n- terbium\n- holmium\n- thulium\n- lutécium",
        children: []
      },
      {
        code: "B1130",
        description: "Catalyseurs usés épurés, contenant des métaux précieux.",
        children: []
      },
      {
        code: "B1140",
        description:
          "Résidus de métaux précieux sous forme solide, contenant des traces de cyanures inorganiques.",
        children: []
      },
      {
        code: "B1150",
        description:
          "Déchets de métaux précieux et de leurs alliages (or, argent, groupe du platine, mais sans le mercure) sous forme non liquide et susceptible de dispersion, avec conditionnement et étiquetage appropriés.",
        children: []
      },
      {
        code: "B1160",
        description:
          "Cendres de métaux précieux provenant de l'incinération de circuits imprimés (voir rubrique correspondante de la liste A [A1150]).",
        children: []
      },
      {
        code: "B1170",
        description:
          "Cendres de métaux précieux provenant de l'incinération de films photographiques.",
        children: []
      },
      {
        code: "B1180",
        description:
          "Déchets de films photographiques contenant des halogénures d'argent et du métal argenté.",
        children: []
      },
      {
        code: "B1190",
        description:
          "Déchets de supports photographiques contenant des halogénures d'argent et du métal argenté.",
        children: []
      },
      {
        code: "B1200",
        description:
          "Laitier granulé provenant de la fabrication du fer et de l'acier.",
        children: []
      },
      {
        code: "B1210",
        description:
          "Scories provenant de la fabrication du fer et de l'acier, y compris l'utilisation de ces scories comme source de dioxyde de titane et de vanadium.",
        children: []
      },
      {
        code: "B1220",
        description:
          "Scories provenant de la production du zinc, chimiquement stabilisées, ayant une forte teneur en fer (plus de 20 %) et traitées conformément aux spécifications industrielles (par exemple DIN 4301) destinées principalement à la construction.",
        children: []
      },
      {
        code: "B1230",
        description:
          "Battitures provenant de la fabrication du fer et de l'acier.",
        children: []
      },
      {
        code: "B1240",
        description: "Dépôts d'oxyde de cuivre.",
        children: []
      },
      {
        code: "B1250",
        description: "",
        children: []
      }
    ]
  },
  {
    code: "B2",
    description:
      "DÉCHETS AYANT PRINCIPALEMENT DES CONSTITUANTS INORGANIQUES POUVANT CONTENIR DES MÉTAUX ET DES MATIÈRES ORGANIQUES",
    children: [
      {
        code: "B2010",
        description:
          "Déchets d'opérations minières sous forme non susceptible de dispersion :\n- déchets de graphite naturel ;\n- déchets d'ardoise, même dégrossie ou simplement débitée, par sciage ou autrement ;\n- déchets de mica ;\n- déchets de leucite, de néphéline et de néphéline syénite ;\n- déchets de feldspath ;\n- déchets de fluorine ;\n- déchets de silicium sous forme solide, à l'exclusion de ceux utilisés dans les opérations de fonderie.",
        children: []
      },
      {
        code: "B2020",
        description:
          "Déchets de verre sous forme non susceptible de dispersion :\n- calcin et autres déchets et débris de verres, à l'exception du verre provenant de tubes cathodiques et autres verres activés.",
        children: []
      },
      {
        code: "B2030",
        description:
          "Déchets de céramiques sous forme non susceptible de dispersion :\n- déchets et débris de cermets (composés métal/céramique) ;\n- fibres à base de céramique, non spécifiées par ailleurs.",
        children: []
      },
      {
        code: "B2040",
        description:
          "Autres déchets contenant essentiellement des matières inorganiques :\n- sulfate de calcium partiellement affiné provenant de la désulfuration des fumées ;\n- déchets d'enduits ou de plaques au plâtre provenant de la démolition de bâtiments ;\n- scories provenant de la production du cuivre, chimiquement stabilisées, contenant une quantité importante de fer (supérieure à 20 %) et traitées conformément aux spécifications industrielles (par exemple DIN 4301 et DIN 8201), destinées principalement à la construction et aux applications abrasives ;\n- soufre sous forme solide ;\n- carbonate de calcium provenant de la production de cyanamide calcique (ayant un pH inférieur à 9) ;\n- chlorures de sodium, de calcium et de potassium ;\n- carborundum (carbure de silicium) ;\n- débris de béton ;\n- déchets de lithium-tantale et de lithium-niobium contenant des débris de verre.",
        children: []
      },
      {
        code: "B2050",
        description:
          "Cendres volantes de centrales électriques alimentées au charbon, ne figurant pas sur la liste A (voir rubrique correspondante sur la liste A [A2060]).",
        children: []
      },
      {
        code: "B2060",
        description:
          "Carbone actif usagé provenant du traitement de l'eau potable et de procédés de l'industrie alimentaire et de la production de vitamines (voir rubrique correspondante de la liste A [A4160]).",
        children: []
      },
      {
        code: "B2070",
        description: "Boues contenant du fluorure de calcium.",
        children: []
      },
      {
        code: "B2080",
        description:
          "Déchets de gypse provenant de traitements chimiques industriels, ne figurant pas sur la liste A (voir rubrique correspondante de la liste A [A2040]).",
        children: []
      },
      {
        code: "B2090",
        description:
          "Anodes usagées de coke et de bitume de pétrole provenant de la production de l'acier et de l'aluminium, épurées selon les spécifications industrielles (à l'exclusion des anodes provenant de l'électrolyse chloro-alcaline et de l'industrie métallurgique).",
        children: []
      },
      {
        code: "B2100",
        description:
          "Déchets d'hydrates d'aluminium et résidus d'alumine provenant de la production de l'alumine, à l'exclusion des matières utilisées dans les opérations d'épuration des gaz, de floculation et de filtration.",
        children: []
      },
      {
        code: "B2110",
        description:
          "Résidus de bauxite (« boues rouges ») (pH moyen, < 11,5).",
        children: []
      },
      {
        code: "B2120",
        description:
          "Solutions acides ou basiques ayant un pH supérieur à 2 et inférieur à 11,5, qui ne sont pas corrosives ou autrement dangereuses (voir rubrique correspondante de la liste A [A4090]).",
        children: []
      },
      {
        code: "B2130",
        description: "",
        children: []
      }
    ]
  },
  {
    code: "B3",
    description:
      "DÉCHETS AYANT PRINCIPALEMENT DES CONSTITUANTS ORGANIQUES POUVANT CONTENIR DES MÉTAUX ET DES MATIÈRES INORGANIQUES",
    children: [
      {
        code: "B3010",
        description:
          "Déchets de matières plastiques sous forme solide :\nMatières plastiques ou matières plastiques composées ci-après, à condition qu'elles ne soient pas mélangées avec d'autres déchets et qu'elles soient préparées selon certaines spécifications :\n- déchets plastiques de polymères et copolymères non halogénés comprenant, mais non limités à (13) :\n- éthylène ;\n- styrène ;\n- polypropylène ;\n- térephtalate de polyéthylène ;\n- acrylonitrile ;\n- butadiène ;\n- polyacétales ;\n- polyamides ;\n- térephtalates de polybutylène ;\n- polycarbonates ;\n- polyéthers ;\n- sulfures de polyphénylène ;\n- polymères acryliques ;\n- alcanes C10-C13 (plastifiants) ;\n- polyuréthannes (ne contenant pas de CFC) ;\n- polysiloxanes ;\n- polyméthacrylate de méthyle ;\n- alcool polyvinylique ;\n- butyral de polyvinyle ;\n- acétate polyvinylique ;\n- déchets de résine ou produits de condensation traités comprenant :\n- résines uréiques de formaldéhyde ;\n- résines phénoliques de formaldéhyde ;\n- résines mélaminiques de formaldéhyde ;\n- résines époxes ;\n- résines alkydes ;\n- polyamides ;\n- déchets de polymères fluorés (14) :\n- perfluoroéthylène/propylène ;\n- alcane alcoxyle perfluoré ;\n- alcane alcoxyle perfluoré* ;\n- fluorure de polyvinyle ;\n- fluorure de polyvinylidène.",
        children: []
      },
      {
        code: "B3020",
        description:
          "Déchets de papier, de carton et de produits de papier :\nMatières ci-après, à condition qu'elles ne soient pas mélangées avec des déchets dangereux :\n- déchets et rebuts de papier ou de carton provenant de :\n- papiers ou cartons écrus ou ondulés ;\n- autres papiers ou cartons obtenus principalement à partir de pâtes chimiques blanches, non colorés dans la masse ;\n- papiers ou cartons obtenus principalement à partir de pâtes mécaniques (journaux, périodiques et imprimés similaires, par exemple) ;\n- autres, comprenant et non limités aux :\nii) cartons contrecollés ;\nii) déchets et rebuts non triés.",
        children: []
      },
      {
        code: "B3026",
        description: "",
        children: []
      },
      {
        code: "B3027",
        description: "",
        children: []
      },
      {
        code: "B3030",
        description:
          "Déchets de matières textiles :\nMatières ci-après, à condition qu'elles ne soient pas mélangées avec d'autres déchets et qu'elles soient préparées selon certaines spécifications :\n- déchets de soie (y compris les cocons non dévidables, les déchets de fils et les effilochés) :\n- non cardés, ni peignés ;\n- autres ;\n- déchets de laine ou de poils fins ou grossiers, y compris les déchets de fils mais à l'exclusion des effilochés :\n- blousses de laine ou de poils fins ;\n- autres déchets de laine ou de poils fins ;\n- déchets de poils grossiers ;\n- déchets de coton (y compris les déchets de fils et les effilochés) :\n- déchets de fils ;\n- effilochés ;\n- autres ;\n- étoupes de déchets de lin ;\n- étoupes et déchets (y compris les déchets de fils et les effilochés) de chanvre (Cannabis sativa L.) ;\n- étoupes et déchets (y compris les déchets de fils et les effilochés) de jute et d'autres fibres textiles libériennes (à l'exclusion du lin, du chanvre et de la ramie) ;\n- étoupes et déchets (y compris les déchets de fils et les effilochés) de sisal et d'autres fibres textiles du genre Agave ;\n- étoupes, blousses et déchets (y compris les déchets de fils et les effilochés) de coco ;\n- étoupes, blousses et déchets (y compris les déchets de fils et les effilochés) d'abaca (chanvre de Manille ou Musa textilis Nee) ;\n- étoupes, blousses et déchets (y compris les déchets de fils et les effilochés) de ramie et d'autres fibres textiles végétales, non dénommés ni compris ailleurs ;\n- déchets (y compris les déchets de fils, blousses et effilochés) :\n- de fibres synthétiques ;\n- de fibres artificielles ;\n- articles de friperie ;\n- chiffons, ficelles, cordes et cordages en matières textiles sous forme de déchets ou d'articles hors d'usage :\n- triés ;\n- autres.",
        children: []
      },
      {
        code: "B3035",
        description: "",
        children: []
      },
      {
        code: "B3040",
        description:
          "Déchets de caoutchouc :\nMatières ci-après, à condition qu'elles ne soient pas mélangées avec d'autres types de déchets :\n- déchets et débris de caoutchouc durci (ébonite, par exemple) ;\n- autres déchets de caoutchouc (à l'exclusion de ceux spécifiés ailleurs).",
        children: []
      },
      {
        code: "B3050",
        description:
          "Déchets de liège et de bois non traités :\n- sciures, déchets et débris de bois, même agglomérés sous forme de bûches, briquettes et boulettes ou sous formes similaires ;\n- déchets de liège : liège concassé, granulé ou pulvérisé.",
        children: []
      },
      {
        code: "B3060",
        description:
          "Déchets issus des industries alimentaires et agro-alimentaires, à condition qu'ils ne soient pas infectieux :\n- lies de vin ;\n- matières végétales et déchets végétaux, résidus et sous-produits végétaux, séchés et stérilisés, même agglomérés sous forme de pellets, des types utilisés pour l'alimentation des animaux, non dénommés ni compris ailleurs ;\n- dégras : résidus provenant du traitement des corps gras ou des cires animales ou végétales ;\n- déchets d'os et de cornillons, bruts, dégraissés, simplement préparés (mais non découpés en forme), acidulés ou dégélatinés ;\n- déchets de poisson ;\n- coques, pellicules (pelures) et autres déchets de cacao ;\n- autres déchets issus des industries alimentaires et agro-alimentaires, à l'exclusion des sous-produits répondant aux exigences et normes nationales et internationales pour la consommation par l'homme et l'alimentation des animaux.",
        children: []
      },
      {
        code: "B3065",
        description: "",
        children: []
      },
      {
        code: "B3070",
        description:
          "Déchets suivants :\n- déchets de cheveux ;\n- déchets de paille ;\n- mycélium de champignon désactivé provenant de la production de la pénicilline, utilisé pour l'alimentation des animaux.",
        children: []
      },
      {
        code: "B3080",
        description: "Déchets, rognures et débris de caoutchouc.",
        children: []
      },
      {
        code: "B3090",
        description:
          "Rognures et autres déchets de cuirs et de peaux préparées ou de cuir reconstitué, non utilisables pour la fabrication d'ouvrages en cuir, à l'exclusion des boues de cuir, ne contenant pas de composés du chrome hexavalent ni de biocides (voir rubrique correspondante de la liste A [A3100]).",
        children: []
      },
      {
        code: "B3100",
        description:
          "Poussières, cendres, boues ou farines de cuir ne contenant pas de composé du chrome hexavalent ni de biocides (voir rubrique correspondante de la liste A [A3090]).",
        children: []
      },
      {
        code: "B3110",
        description:
          "Déchets issus de la pelleterie, ne contenant pas de composés du chrome hexavalent, de biocides ni de substances infectieuses (voir rubrique correspondante de la liste A [A3110]).",
        children: []
      },
      {
        code: "B3120",
        description: "Déchets constitués de colorants alimentaires.",
        children: []
      },
      {
        code: "B3130",
        description:
          "Déchets d'éthers polymères et déchets d'éthers monomères non dangereux et incapables de former des peroxydes.",
        children: []
      },
      {
        code: "B3140",
        description:
          "Pneumatiques usagés, à l'exclusion de ceux destinés aux opérations citées à l'annexe IV A.",
        children: []
      }
    ]
  },
  {
    code: "B4",
    description:
      "DÉCHETS POUVANT CONTENIR DES CONSTITUANTS INORGANIQUES OU ORGANIQUES",
    children: [
      {
        code: "B4010",
        description:
          "Déchets constitués principalement de peintures à l'eau/à l'huile, d'encres et de vernis durcis, ne contenant pas de solvants organiques, de métaux lourds ni de biocides à des concentrations pouvant les rendre dangereux (voir rubrique correspondante de la liste A [A4070]).",
        children: []
      },
      {
        code: "B4020",
        description:
          "Déchets issus de la production, de la préparation et de l'utilisation de résines, de latex, de plastifiants ou de colles et adhésifs, ne figurant pas sur la liste A et dépourvus de solvants et d'autres contaminants de sorte qu'ils ne possèdent pas les caractéristiques de danger mentionnés à l'annexe III, par exemple lorsqu'ils sont à base d'eau ou de colles à bases d'amidon (caséine), dextrine, éthers cellulosiques et alcools polyvinyliques (voir rubrique correspondante de la liste A [A3050]).",
        children: []
      },
      {
        code: "B4030",
        description:
          "Déchets d'appareils photographiques jetables après usage avec piles ne figurant pas sur la liste A.",
        children: []
      }
    ]
  }
] as const satisfies readonly BaleCodeNode[];

export const BALE_CODES_TREE = WASTE_CODES_TREE;
