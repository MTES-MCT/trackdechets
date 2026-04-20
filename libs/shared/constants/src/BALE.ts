// Convention de codage Basel (Annexe VIII et IX de la Convention de Bâle)

export type BaleWasteNode = Readonly<{
  code: string;
  description: string;
  children: readonly BaleWasteNode[];
}>;

export const ALL_BALE_WASTES_TREE = [
  {
    code: "A",
    description: "LISTE A — DÉCHETS DANGEREUX",
    children: [
      {
        code: "A1",
        description: "DÉCHETS DE MÉTAUX ET DÉCHETS CONTENANT DES MÉTAUX",
        children: [
          {
            code: "A1010",
            description:
              "Déchets de métaux et déchets constitués d'alliages d'un ou plusieurs des métaux suivants : • antimoine • arsenic • béryllium • cadmium • plomb • mercure • sélénium • tellure • thallium à l'exclusion des déchets de ce type inscrits sur la liste B.",
            children: []
          },
          {
            code: "A1020",
            description:
              "Déchets, à l'exception des déchets de métaux sous forme massive, ayant comme constituants ou contaminants l'une des substances suivantes : • antimoine ; composés de l'antimoine • béryllium ; composés du béryllium • cadmium ; composés du cadmium • plomb ; composés du plomb • sélénium ; composés du sélénium • tellure ; composés du tellure.",
            children: []
          },
          {
            code: "A1030",
            description:
              "Déchets ayant comme constituants ou contaminants l'une des substances suivantes : • arsenic ; composés de l'arsenic • mercure ; composés du mercure • thallium ; composés du thallium.",
            children: []
          },
          {
            code: "A1040",
            description:
              "Déchets ayant comme constituants des : • métaux carbonyles • composés du chrome hexavalent.",
            children: []
          },
          {
            code: "A1050",
            description: "Boues de galvanisation",
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
              "Déchets de zinc ne figurant pas sur la liste B et contenant du plomb et du cadmium à des concentrations suffisantes pour qu'ils présentent l'une des caractéristiques de l'annexe III.",
            children: []
          },
          {
            code: "A1090",
            description:
              "Cendres provenant de l'incinération de fils de cuivre isolés.",
            children: []
          },
          {
            code: "A1100",
            description:
              "Poussières et résidus provenant des systèmes d'épuration des fumées des fonderies de cuivre.",
            children: []
          },
          {
            code: "A1110",
            description:
              "Solutions électrolytiques usagées provenant des opérations d'affinage électrolytique et d'électrorécupération du cuivre.",
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
              "Cendres de métaux précieux provenant de l'incinération de circuits imprimés ne figurant pas sur la liste B.",
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
              "Assemblages électriques et électroniques usagés ou sous forme de débris contenant des éléments tels que les accumulateurs et autres batteries mentionnés sur la liste A, les rupteurs à mercure, les verres provenant de tubes à rayons cathodiques et d'autres verres activés et condensateurs à PCB, ou contaminés par les constituants cités à l'annexe I dans une proportion telle qu'ils puissent posséder l'une quelconque des caractéristiques citées à l'annexe III.",
            children: []
          },
          {
            code: "A1190",
            description:
              "Déchets de câbles métalliques revêtus de matières plastiques ou isolés par des matières plastiques, ou contaminés par du goudron, des PCB, du plomb, du cadmium, d’autres composés organohalogénés ou d’autres constituants de l’Annexe I au point de présenter des caractéristiques de l’Annexe III.",
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
              "Déchets de gypse provenant de traitements chimiques industriels contenant des constituants cités à l'annexe I dans une proportion telle qu'ils puissent posséder l'une des caractéristiques de danger énumérées à l'annexe III.",
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
              "Cendres volantes de centrales électriques alimentées au charbon contenant des substances citées à l'annexe I à des concentrations suffisantes pour qu'elles possèdent l'une des caractéristiques énumérées à l'annexe III.",
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
              "Déchets issus de la production, de la préparation et de l'utilisation de résines, de latex, de plastifiants ou de colles et adhésifs, à l'exclusion de ceux mentionnés sur la liste B.",
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
              "Sciures, cendres, boues et farines de cuir contenant des composés de chrome hexavalent ou des biocides.",
            children: []
          },
          {
            code: "A3100",
            description:
              "Rognures et autres déchets de cuir et de peau préparés ou de cuir reconstitué, non utilisables pour la fabrication d'ouvrages en cuir, contenant des composés de chrome hexavalent ou des biocides.",
            children: []
          },
          {
            code: "A3110",
            description:
              "Déchets issus des opérations de pelleterie contenant des composés de chrome hexavalent, des biocides ou des substances infectieuses.",
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
              "Déchets contenant, consistant en, ou contaminés par des biphényles polychlorés (PCB), des terphényles polychlorés (PCT), du naphtalène polychloré (PCN) ou des biphényles polybromés (PBB), y compris tout composé polybromé analogue ayant une concentration égale ou supérieure à 50 mg/kg.",
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
            description:
              "Enrobés contenant du goudron et provenant de la construction et de l’entretien des routes (voir rubrique correspondante de la liste B-B2130)",
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
              "Déchets issus de la fabrication, de la préparation et de l'utilisation de produits chimiques destinés à la préservation du bois.",
            children: []
          },
          {
            code: "A4050",
            description:
              "Déchets contenant, consistant en, ou contaminés par l'une des substances suivantes : • cyanures inorganiques, exceptés les résidus de métaux précieux sous forme solide contenant des traces de cyanures inorganiques • cyanures organiques.",
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
              "Déchets issus de la production, de la préparation et de l'utilisation d'encres, de colorants, de pigments, de peintures, de laques ou de vernis, exceptés ceux qui figurent sur la liste B.",
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
              "Solutions acides ou basiques, autres que celles qui figurent dans la rubrique correspondante de la liste B.",
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
              "Déchets contenant, consistant en, ou contaminés par l'une des substances suivantes : • tout produit de la famille des dibenzofuranes polychlorés • tout produit de la famille des dibenzoparadioxines polychlorées.",
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
              "Déchets consistant en, ou contenant des produits chimiques non conformes aux spécifications ou périmés, appartenant aux catégories de l'annexe I et ayant les caractéristiques de danger figurant à l'annexe III.",
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
              "Déchets contenant du carbone actif usé ne figurant pas sur la liste B.",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "B",
    description: "LISTE B — DÉCHETS NON DANGEREUX",
    children: [
      {
        code: "B1",
        description: "DÉCHETS DE MÉTAUX ET DÉCHETS CONTENANT DES MÉTAUX",
        children: [
          {
            code: "B1010",
            description:
              "Déchets de métaux et de leurs alliages sous forme métallique, non susceptible de dispersion : • métaux précieux (or, argent, groupe du platine, le mercure étant exclu) • déchets de fer et d'acier • déchets de cuivre • déchets de nickel • déchets d'aluminium • déchets de zinc • déchets d'étain • déchets de tungstène • déchets de molybdène • déchets de tantale • déchets de magnésium • déchets de cobalt • déchets de bismuth • déchets de titane • déchets de zirconium • déchets de manganèse • déchets de germanium • déchets de vanadium • déchets de hafnium, indium, niobium, rhénium et gallium • déchets de thorium • déchets de terres rares.",
            children: []
          },
          {
            code: "B1020",
            description:
              "Débris purs et non contaminés des métaux suivants, y compris leurs alliages, sous forme finie (lames, plaques, poutres, tiges, etc.) : • antimoine • béryllium • cadmium • plomb (à l'exclusion des accumulateurs électriques au plomb et à l'acide) • sélénium • tellurium.",
            children: []
          },
          {
            code: "B1030",
            description: "Métaux réfractaires contenant des résidus.",
            children: []
          },
          {
            code: "B1031",
            description:
              "Déchets de métaux et d’alliages constitués d’un ou plusieurs des métaux suivants : molybdène, tungstène, titane, tantale, niobium et rhénium sous forme métallique dispersible (poudre métallique), à l’exception de déchets tels que ceux spécifiés dans la liste A, à la rubrique A1050 – boues de galvanisation",
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
              "Mélanges de résidus métalliques non ferreux (fractions lourdes) ne contenant pas de matières de l'annexe I à des concentrations telles qu'ils puissent avoir les caractéristiques de danger figurant à l'annexe III.",
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
              "Cendres et résidus de zinc, y compris résidus d'alliages de zinc sous forme susceptible de dispersion, sauf s'ils contiennent des constituants de l'annexe I à des concentrations telles qu'ils puissent avoir la caractéristique de danger H4.3 figurant à l'annexe III.",
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
              "Déchets contenant des métaux et issus des opérations de fusion, de fonte et d'affinage des métaux : • mattes de galvanisation • écumes et laitiers de zinc • mattes de surface de la galvanisation (>90 % Zn) • mattes de fonds de la galvanisation (>92 % Zn) • laitiers de fonderie sous pression (>85 % Zn) • laitiers provenant de la galvanisation à chaud (procédé discontinu) (>92 % Zn) • résidus provenant de l'écumage du zinc • résidus provenant de l'écumage de l'aluminium, à l'exclusion de ceux contenant du sel • scories provenant du traitement du cuivre et destinées à une récupération ultérieure ne contenant pas d'arsenic, de plomb, ni de cadmium • dépôts réfractaires, y compris les creusets, issus de la fonte du cuivre • scories provenant du traitement des métaux précieux et destinées à un affinage ultérieur • scories d'étain contenant du tantale, contenant moins de 0,5 % d'étain.",
            children: []
          },
          {
            code: "B1110",
            description:
              "Assemblages électriques et électroniques : • assemblages électriques constitués uniquement de métaux ou d'alliages de métaux • assemblages électriques et électroniques usagés ou déchets (y compris les circuits imprimés) ne contenant pas d'éléments tels que les accumulateurs et autres batteries mentionnés sur la liste A, les rupteurs à mercure, les verres provenant de tubes à rayons cathodiques et d'autres verres activés et condensateurs à PCB • assemblages électriques et électroniques (y compris circuits imprimés, composants et fils électriques) destinés à une réutilisation directe et non au recyclage ou à l'élimination définitive.",
            children: []
          },
          {
            code: "B1115",
            description:
              "Déchets de câbles métalliques revêtus de matières plastiques ou isolés par des matières plastiques, non inscrits à la rubrique A A1190, à l’exclusion de ceux qui sont destinés à des opérations visées à l’Annexe IV A ou à toute autre opération d’élimination impliquant, à un stade quelconque, un procédé thermique non contrôlé, tel que le brûlage à l’air libre.",
            children: []
          },
          {
            code: "B1120",
            description:
              "Catalyseurs usagés, à l'exclusion des liquides utilisés comme catalyseurs, contenant l'une quelconque des substances suivantes : Métaux de transition, à l'exclusion des déchets de catalyseurs usagés de la liste A : • scandium, vanadium, manganèse, cobalt, cuivre, yttrium, niobum, hafnium, tungstène, titane, chrome, fer, nickel, zinc, zirconium, molybdène, tantale, rhénium ; Lanthanides (métaux du groupe des terres rares) : • lanthane, praséodyme, samarium, gadolinium, dysprosium, erbium, ytterbium, cérium, néodyme, europium, terbium, holmium, thulium, lutécium.",
            children: []
          },
          {
            code: "B1130",
            description:
              "Catalyseurs usés épurés, contenant des métaux précieux.",
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
              "Cendres de métaux précieux provenant de l'incinération de circuits imprimés.",
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
            description:
              "Véhicules à moteur en fin de vie ne contenant ni liquides ni autres éléments dangereux",
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
              "Déchets d'opérations minières sous forme non susceptible de dispersion : • déchets de graphite naturel • déchets d'ardoise • déchets de mica • déchets de leucite, de néphéline et de néphéline syénite • déchets de feldspath • déchets de fluorine • déchets de silicium sous forme solide, à l'exclusion de ceux utilisés dans les opérations de fonderie.",
            children: []
          },
          {
            code: "B2020",
            description:
              "Déchets de verre sous forme non susceptible de dispersion : • calcin et autres déchets et débris de verres, à l'exception du verre provenant de tubes cathodiques et autres verres activés.",
            children: []
          },
          {
            code: "B2030",
            description:
              "Déchets de céramiques sous forme non susceptible de dispersion : • déchets et débris de cermets (composés métal/céramique) • fibres à base de céramique, non spécifiées par ailleurs.",
            children: []
          },
          {
            code: "B2040",
            description:
              "Autres déchets contenant essentiellement des matières inorganiques : • sulfate de calcium partiellement affiné provenant de la désulfuration des fumées • déchets d'enduits ou de plaques au plâtre provenant de la démolition de bâtiments • scories provenant de la production du cuivre, chimiquement stabilisées • soufre sous forme solide • carbonate de calcium provenant de la production de cyanamide calcique • chlorures de sodium, de calcium et de potassium • carborundum (carbure de silicium) • débris de béton • déchets de lithium-tantale et de lithium-niobium contenant des débris de verre.",
            children: []
          },
          {
            code: "B2050",
            description:
              "Cendres volantes de centrales électriques alimentées au charbon, ne figurant pas sur la liste A.",
            children: []
          },
          {
            code: "B2060",
            description:
              "Carbone actif usagé provenant du traitement de l'eau potable et de procédés de l'industrie alimentaire et de la production de vitamines.",
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
              "Déchets de gypse provenant de traitements chimiques industriels, ne figurant pas sur la liste A.",
            children: []
          },
          {
            code: "B2090",
            description:
              "Anodes usagées de coke et de bitume de pétrole provenant de la production de l'acier et de l'aluminium, épurées selon les spécifications industrielles.",
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
              "Solutions acides ou basiques ayant un pH supérieur à 2 et inférieur à 11,5, qui ne sont pas corrosives ou autrement dangereuses.",
            children: []
          },
          {
            code: "B2130",
            description:
              "Matières bitumineuses (déchets d’asphalte) provenant de la construction et de l’entretien des routes ne contenant pas de goudron (voir la rubrique correspondante de la liste A A3200)",
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
              "Déchets de matières plastiques sous forme solide : Matières plastiques ou matières plastiques composées ci-après, à condition qu'elles ne soient pas mélangées avec d'autres déchets et qu'elles soient préparées selon certaines spécifications : • déchets plastiques de polymères et copolymères non halogénés • déchets de résine ou produits de condensation traités • déchets de polymères fluorés.",
            children: []
          },
          {
            code: "B3020",
            description:
              "Déchets de papier, de carton et de produits de papier : Matières ci-après, à condition qu'elles ne soient pas mélangées avec des déchets dangereux : • déchets et rebuts de papier ou de carton provenant de papiers ou cartons écrus ou ondulés, autres papiers ou cartons, journaux, périodiques, etc.",
            children: []
          },
          {
            code: "B3026",
            description:
              "Déchets ci-après, issus du prétraitement d’emballages composites pour liquides, ne contenant pas de matières visées à l’Annexe I à des concentrations suffisantes pour présenter une des caractéristiques de danger figurant dans l’Annexe III : • Fraction non séparable de plastique • Fraction non séparable de plastique-aluminium",
            children: []
          },
          {
            code: "B3027",
            description:
              "Déchets de pelliculage d’étiquettes adhésives contenant des matières premières utilisées dans la fabrication des étiquettes",
            children: []
          },
          {
            code: "B3030",
            description:
              "Déchets de matières textiles : Matières ci-après, à condition qu'elles ne soient pas mélangées avec d'autres déchets et qu'elles soient préparées selon certaines spécifications : • déchets de soie, laine, coton, lin, chanvre, jute, sisal, coco, abaca, ramie • déchets de fibres synthétiques et artificielles • articles de friperie • chiffons, ficelles, cordes et cordages.",
            children: []
          },
          {
            code: "B3035",
            description:
              "Déchets de revêtements de sols en matières textiles, tapis",
            children: []
          },
          {
            code: "B3040",
            description:
              "Déchets de caoutchouc : Matières ci-après, à condition qu'elles ne soient pas mélangées avec d'autres types de déchets : • déchets et débris de caoutchouc durci (ébonite, par exemple) • autres déchets de caoutchouc (à l'exclusion de ceux spécifiés ailleurs).",
            children: []
          },
          {
            code: "B3050",
            description:
              "Déchets de liège et de bois non traités : • sciures, déchets et débris de bois • déchets de liège.",
            children: []
          },
          {
            code: "B3060",
            description:
              "Déchets issus des industries alimentaires et agro-alimentaires, à condition qu'ils ne soient pas infectieux : • lies de vin • matières végétales et déchets végétaux • dégras • déchets d'os et de cornillons • déchets de poisson • coques, pellicules et autres déchets de cacao • autres déchets issus des industries alimentaires.",
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
              "Déchets suivants : • déchets de cheveux • déchets de paille • mycélium de champignon désactivé provenant de la production de la pénicilline.",
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
              "Rognures et autres déchets de cuirs et de peaux préparées ou de cuir reconstitué, non utilisables pour la fabrication d'ouvrages en cuir, à l'exclusion des boues de cuir, ne contenant pas de composés du chrome hexavalent ni de biocides.",
            children: []
          },
          {
            code: "B3100",
            description:
              "Poussières, cendres, boues ou farines de cuir ne contenant pas de composé du chrome hexavalent ni de biocides.",
            children: []
          },
          {
            code: "B3110",
            description:
              "Déchets issus de la pelleterie, ne contenant pas de composés du chrome hexavalent, de biocides ni de substances infectieuses.",
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
              "Déchets constitués principalement de peintures à l'eau/à l'huile, d'encres et de vernis durcis, ne contenant pas de solvants organiques, de métaux lourds ni de biocides à des concentrations pouvant les rendre dangereux.",
            children: []
          },
          {
            code: "B4020",
            description:
              "Déchets issus de la production, de la préparation et de l'utilisation de résines, de latex, de plastifiants ou de colles et adhésifs, ne figurant pas sur la liste A et dépourvus de solvants et d'autres contaminants, par exemple lorsqu'ils sont à base d'eau ou de colles à bases d'amidon.",
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
    ]
  }
] as const satisfies readonly BaleWasteNode[];

// ─── Utilitaires ────────────────────────────────────────────────────────────────

function flatten(wastes: readonly BaleWasteNode[]): BaleWasteNode[] {
  return wastes
    .reduce(
      (acc: BaleWasteNode[], waste) =>
        acc.concat([waste, ...flatten(waste.children)]),
      []
    )
    .filter(
      // only keep actual wastes (codes A/B + 4 digits) and filter out categories
      waste => waste.code.length >= 5
    );
}

export function toBaleWasteTree(
  wasteNodes: readonly BaleWasteNode[],
  opts?: { exclude?: string[] } | { include?: string[] }
): BaleWasteNode[] {
  return wasteNodes
    .filter(({ code }) => {
      if (opts && "exclude" in opts && opts.exclude?.length) {
        return !opts.exclude.includes(code);
      }
      if (opts && "include" in opts && opts.include?.length) {
        return opts.include.some(includedCode => includedCode.startsWith(code));
      }
      return true;
    })
    .map(({ code, description, children }) => ({
      code,
      description,
      children: toBaleWasteTree(children, opts)
    }));
}

// ─── Exports dérivés ─────────────────────────────────────────────────────────

export const ALL_BALE_WASTES = flatten(ALL_BALE_WASTES_TREE);

/** Tous les codes Bâle (feuilles uniquement) */
export const ALL_BALE_WASTE_CODES = ALL_BALE_WASTES.map(w => w.code);

/** Codes de la liste A (dangereux) */
export const BALE_LIST_A_WASTES = ALL_BALE_WASTES.filter(w =>
  w.code.startsWith("A")
);
export const BALE_LIST_A_WASTE_CODES = BALE_LIST_A_WASTES.map(w => w.code);

/** Codes de la liste B (non dangereux) */
export const BALE_LIST_B_WASTES = ALL_BALE_WASTES.filter(w =>
  w.code.startsWith("B")
);
export const BALE_LIST_B_WASTE_CODES = BALE_LIST_B_WASTES.map(w => w.code);

/** Vérifie si un code Bâle est en liste A (dangereux) */
export function isBaleListA(baleCode?: string | null): boolean {
  if (!baleCode) return false;
  return baleCode.startsWith("A");
}

/** Vérifie si un code Bâle est en liste B (non dangereux) */
export function isBaleListB(baleCode?: string | null): boolean {
  if (!baleCode) return false;
  return baleCode.startsWith("B");
}

// ─── Rétrocompatibilité avec l'ancien export ─────────────────────────────────

/** @deprecated Utiliser ALL_BALE_WASTES_TREE */
export const WASTE_CODES_TREE = ALL_BALE_WASTES_TREE;

/** @deprecated Utiliser BALE_CODES_TREE */
export const BALE_CODES_TREE = ALL_BALE_WASTES_TREE;

/** @deprecated Utiliser ALL_BALE_WASTE_CODES */
export const WASTE_CODES_BALE =
  ALL_BALE_WASTE_CODES as unknown as readonly string[];

export type BaleCodeNode = BaleWasteNode;

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
