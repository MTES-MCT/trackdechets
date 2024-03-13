// source: https://aida.ineris.fr/consultation_document/10327

export interface WasteNode {
  code: string;
  description: string;
  children: WasteNode[];
}

export const ALL_WASTES_TREE: WasteNode[] = [
  {
    code: "01",
    description:
      "DÉCHETS PROVENANT DE L'EXPLORATION ET DE L'EXPLOITATION DES MINES ET DES CARRIÈRES AINSI QUE DU TRAITEMENT PHYSIQUE ET CHIMIQUE DES MINÉRAUX",
    children: [
      {
        code: "01 01",
        description: "déchets provenant de l'extraction des minéraux",
        children: [
          {
            code: "01 01 01",
            description:
              "déchets provenant de l'extraction des minéraux métallifères",
            children: []
          },
          {
            code: "01 01 02",
            description:
              "déchets provenant de l'extraction des minéraux non métallifères",
            children: []
          }
        ]
      },
      {
        code: "01 03",
        description:
          "déchets provenant de la transformation physique et chimique des minéraux métallifères",
        children: [
          {
            code: "01 03 04*",
            description:
              "stériles acidogènes provenant de la transformation du sulfure",
            children: []
          },
          {
            code: "01 03 05*",
            description: "autres stériles contenant des substances dangereuses",
            children: []
          },
          {
            code: "01 03 06",
            description:
              "stériles autres que ceux visés aux rubriques 01 03 04 et 01 03 05",
            children: []
          },
          {
            code: "01 03 07*",
            description:
              "autres déchets contenant des substances dangereuses provenant de la transformation physique et chimique des minéraux métallifères",
            children: []
          },
          {
            code: "01 03 08",
            description:
              "déchets de poussières et de poudres autres que ceux visés à la rubrique 01 03 07",
            children: []
          },
          {
            code: "01 03 09",
            description:
              "boues rouges issues de la production d'alumine autres que celles visées à la rubrique 01 03 10",
            children: []
          },
          {
            code: "01 03 10*",
            description:
              "boues rouges issues de la production d'alumine contenant des substances dangereuses, autres que les déchets visés à la rubrique 01 03 07",
            children: []
          },
          {
            code: "01 03 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "01 04",
        description:
          "déchets provenant de la transformation physique et chimique des minéraux non métallifères",
        children: [
          {
            code: "01 04 07*",
            description:
              "déchets contenant des substances dangereuses provenant de la transformation physique et chimique des minéraux non métallifères",
            children: []
          },
          {
            code: "01 04 08",
            description:
              "déchets de graviers et débris de pierres autres que ceux visés à la rubrique 01 04 07",
            children: []
          },
          {
            code: "01 04 09",
            description: "déchets de sable et d'argile",
            children: []
          },
          {
            code: "01 04 10",
            description:
              "déchets de poussières et de poudres autres que ceux visés à la rubrique 01 04 07",
            children: []
          },
          {
            code: "01 04 11",
            description:
              "déchets de la transformation de la potasse et des sels minéraux autres que ceux visés à la rubrique 01 04 07",
            children: []
          },
          {
            code: "01 04 12",
            description:
              "stériles et autres déchets provenant du lavage et du nettoyage des minéraux autres que ceux visés aux rubriques 01 04 07 et 01 04 11",
            children: []
          },
          {
            code: "01 04 13",
            description:
              "déchets provenant de la taille et du sciage des pierres autres que ceux visés à la rubrique 01 04 07",
            children: []
          },
          {
            code: "01 04 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "01 05",
        description: "boues de forage et autres déchets de forage",
        children: [
          {
            code: "01 05 04",
            description: "boues et autres déchets de forage à l'eau douce",
            children: []
          },
          {
            code: "01 05 05*",
            description:
              "boues et autres déchets de forage contenant des hydrocarbures",
            children: []
          },
          {
            code: "01 05 06*",
            description:
              "boues de forage et autres déchets de forage contenant des substances dangereuses",
            children: []
          },
          {
            code: "01 05 07",
            description:
              "boues et autres déchets de forage contenant des sels de baryum, autres que ceux visés aux rubriques 01 05 05 et 01 05 06",
            children: []
          },
          {
            code: "01 05 08",
            description:
              "boues et autres déchets de forage contenant des chlorures, autres que ceux visés aux rubriques 01 05 05 et 01 05 06",
            children: []
          },
          {
            code: "01 05 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "02",
    description:
      "DÉCHETS PROVENANT DE L'AGRICULTURE, DE L'HORTICULTURE, DE L'AQUACULTURE, DE LA SYLVICULTURE, DE LA CHASSE ET DE LA PÊCHE AINSI QUE DE LA PRÉPARATION ET DE LA TRANSFORMATION DES ALIMENTS",
    children: [
      {
        code: "02 01",
        description:
          "déchets provenant de l'agriculture, de l'horticulture, de l'aquaculture, de la sylviculture, de la chasse et de la pêche",
        children: [
          {
            code: "02 01 01",
            description: "boues provenant du lavage et du nettoyage",
            children: []
          },
          {
            code: "02 01 02",
            description: "déchets de tissus animaux",
            children: []
          },
          {
            code: "02 01 03",
            description: "déchets de tissus végétaux",
            children: []
          },
          {
            code: "02 01 04",
            description:
              "déchets de matières plastiques (à l'exclusion des emballages)",
            children: []
          },
          {
            code: "02 01 06",
            description:
              "fèces, urine et fumier (y compris paille souillée), effluents, collectés séparément et traités hors site",
            children: []
          },
          {
            code: "02 01 07",
            description: "déchets provenant de la sylviculture",
            children: []
          },
          {
            code: "02 01 08*",
            description:
              "déchets agrochimiques contenant des substances dangereuses",
            children: []
          },
          {
            code: "02 01 09",
            description:
              "déchets agrochimiques autres que ceux visés à la rubrique 02 01 08",
            children: []
          },
          {
            code: "02 01 10",
            description: "déchets métalliques",
            children: []
          },
          {
            code: "02 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "02 02",
        description:
          "déchets provenant de la préparation et de la transformation de la viande, des poissons et autres aliments d'origine animale",
        children: [
          {
            code: "02 02 01",
            description: "boues provenant du lavage et du nettoyage",
            children: []
          },
          {
            code: "02 02 02",
            description: "déchets de tissus animaux",
            children: []
          },
          {
            code: "02 02 03",
            description:
              "matières impropres à la consommation ou à la transformation",
            children: []
          },
          {
            code: "02 02 04",
            description: "boues provenant du traitement in situ des effluents",
            children: []
          },
          {
            code: "02 02 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "02 03",
        description:
          "déchets provenant de la préparation et de la transformation des fruits, des légumes, des céréales, des huiles alimentaires, du cacao, du café, du thé et du tabac, de la production de conserves, de la production de levures et d'extraits de levures, de la préparation et de la fermentation de mélasses",
        children: [
          {
            code: "02 03 01",
            description:
              "boues provenant du lavage, du nettoyage, de l'épluchage, de la centrifugation et de la séparation",
            children: []
          },
          {
            code: "02 03 02",
            description: "déchets d'agents de conservation",
            children: []
          },
          {
            code: "02 03 03",
            description: "déchets de l'extraction aux solvants",
            children: []
          },
          {
            code: "02 03 04",
            description:
              "matières impropres à la consommation ou à la transformation",
            children: []
          },
          {
            code: "02 03 05",
            description: "boues provenant du traitement in situ des effluents",
            children: []
          },
          {
            code: "02 03 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "02 04",
        description: "déchets de la transformation du sucre",
        children: [
          {
            code: "02 04 01",
            description:
              "terre provenant du lavage et du nettoyage des betteraves",
            children: []
          },
          {
            code: "02 04 02",
            description: "carbonate de calcium déclassé",
            children: []
          },
          {
            code: "02 04 03",
            description: "boues provenant du traitement in situ des effluents",
            children: []
          },
          {
            code: "02 04 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "02 05",
        description: "déchets provenant de l'industrie des produits laitiers",
        children: [
          {
            code: "02 05 01",
            description:
              "matières impropres à la consommation ou à la transformation",
            children: []
          },
          {
            code: "02 05 02",
            description: "boues provenant du traitement in situ des effluents",
            children: []
          },
          {
            code: "02 05 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "02 06",
        description: "déchets de boulangerie, pâtisserie, confiserie",
        children: [
          {
            code: "02 06 01",
            description:
              "matières impropres à la consommation ou à la transformation",
            children: []
          },
          {
            code: "02 06 02",
            description: "déchets d'agents de conservation",
            children: []
          },
          {
            code: "02 06 03",
            description: "boues provenant du traitement in situ des effluents",
            children: []
          },
          {
            code: "02 06 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "02 07",
        description:
          "déchets provenant de la production de boissons alcooliques et non alcooliques (sauf café, thé et cacao)",
        children: [
          {
            code: "02 07 01",
            description:
              "déchets provenant du lavage, du nettoyage et de la réduction mécanique des matières premières",
            children: []
          },
          {
            code: "02 07 02",
            description: "déchets de la distillation de l'alcool",
            children: []
          },
          {
            code: "02 07 03",
            description: "déchets de traitements chimiques",
            children: []
          },
          {
            code: "02 07 04",
            description:
              "matières impropres à la consommation ou à la transformation",
            children: []
          },
          {
            code: "02 07 05",
            description: "boues provenant du traitement in situ des effluents",
            children: []
          },
          {
            code: "02 07 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "03",
    description:
      "DÉCHETS PROVENANT DE LA TRANSFORMATION DU BOIS ET DE LA PRODUCTION DE PANNEAUX ET DE MEUBLES, DE PÂTE À PAPIER, DE PAPIER ET DE CARTON",
    children: [
      {
        code: "03 01",
        description:
          "déchets provenant de la transformation du bois et de la fabrication de panneaux et de meubles",
        children: [
          {
            code: "03 01 01",
            description: "déchets d'écorce et de liège",
            children: []
          },
          {
            code: "03 01 04*",
            description:
              "sciure de bois, copeaux, chutes, bois, panneaux de particules et placages contenant des substances dangereuses",
            children: []
          },
          {
            code: "03 01 05",
            description:
              "sciure de bois, copeaux, chutes, bois, panneaux de particules et placages autres que ceux visés à la rubrique 03 01 04",
            children: []
          },
          {
            code: "03 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "03 02",
        description: "déchets des produits de protection du bois",
        children: [
          {
            code: "03 02 01*",
            description:
              "composés organiques non halogénés de protection du bois",
            children: []
          },
          {
            code: "03 02 02*",
            description: "composés organochlorés de protection du bois",
            children: []
          },
          {
            code: "03 02 03*",
            description: "composés organométalliques de protection du bois",
            children: []
          },
          {
            code: "03 02 04*",
            description: "composés inorganiques de protection du bois",
            children: []
          },
          {
            code: "03 02 05*",
            description:
              "autres produits de protection du bois contenant des substances dangereuses",
            children: []
          },
          {
            code: "03 02 99",
            description:
              "produits de protection du bois non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "03 03",
        description:
          "déchets provenant de la production et de la transformation de papier, de carton et de pâte à papier",
        children: [
          {
            code: "03 03 01",
            description: "déchets d'écorce et de bois",
            children: []
          },
          {
            code: "03 03 02",
            description:
              "liqueurs vertes (provenant de la récupération de liqueur de cuisson)",
            children: []
          },
          {
            code: "03 03 05",
            description: "boues de désencrage provenant du recyclage du papier",
            children: []
          },
          {
            code: "03 03 07",
            description:
              "refus séparés mécaniquement provenant du broyage de déchets de papier et de carton",
            children: []
          },
          {
            code: "03 03 08",
            description:
              "déchets provenant du tri de papier et de carton destinés au recyclage",
            children: []
          },
          {
            code: "03 03 09",
            description: "déchets de boues résiduaires de chaux",
            children: []
          },
          {
            code: "03 03 10",
            description:
              "refus fibreux, boues de fibres, de charge et de couchage provenant d'une séparation mécanique",
            children: []
          },
          {
            code: "03 03 11",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 03 03 10",
            children: []
          },
          {
            code: "03 03 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "04",
    description:
      "DÉCHETS PROVENANT DES INDUSTRIES DU CUIR, DE LA FOURRURE ET DU TEXTILE",
    children: [
      {
        code: "04 01",
        description:
          "déchets provenant de l'industrie du cuir et de la fourrure",
        children: [
          {
            code: "04 01 01",
            description: "déchets d'écharnage et refentes",
            children: []
          },
          {
            code: "04 01 02",
            description: "résidus de pelanage",
            children: []
          },
          {
            code: "04 01 03*",
            description:
              "déchets de dégraissage contenant des solvants sans phase liquide",
            children: []
          },
          {
            code: "04 01 04",
            description: "liqueur de tannage contenant du chrome",
            children: []
          },
          {
            code: "04 01 05",
            description: "liqueur de tannage sans chrome",
            children: []
          },
          {
            code: "04 01 06",
            description:
              "boues, notamment provenant du traitement in situ des effluents, contenant du chrome",
            children: []
          },
          {
            code: "04 01 07",
            description:
              "boues, notamment provenant du traitement in situ des effluents, sans chrome",
            children: []
          },
          {
            code: "04 01 08",
            description:
              "déchets de cuir tanné (refentes sur bleu, dérayures, échantillonnages, poussières de ponçage), contenant du chrome",
            children: []
          },
          {
            code: "04 01 09",
            description: "déchets provenant de l'habillage et des finitions",
            children: []
          },
          {
            code: "04 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "04 02",
        description: "déchets de l'industrie textile",
        children: [
          {
            code: "04 02 09",
            description:
              "matériaux composites (textile imprégné, élastomère, plastomère)",
            children: []
          },
          {
            code: "04 02 10",
            description:
              "matières organiques issues de produits naturels (par exemple graisse, cire)",
            children: []
          },
          {
            code: "04 02 14*",
            description:
              "déchets provenant des finitions contenant des solvants organiques",
            children: []
          },
          {
            code: "04 02 15",
            description:
              "déchets provenant des finitions autres que ceux visés à la rubrique 04 02 14",
            children: []
          },
          {
            code: "04 02 16*",
            description:
              "teintures et pigments contenant des substances dangereuses",
            children: []
          },
          {
            code: "04 02 17",
            description:
              "teintures et pigments autres que ceux visés à la rubrique 04 02 16",
            children: []
          },
          {
            code: "04 02 19*",
            description:
              "boues provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "04 02 20",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 04 02 19",
            children: []
          },
          {
            code: "04 02 21",
            description: "fibres textiles non ouvrées",
            children: []
          },
          {
            code: "04 02 22",
            description: "fibres textiles ouvrées",
            children: []
          },
          {
            code: "04 02 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "05",
    description:
      "DÉCHETS PROVENANT DU RAFFINAGE DU PÉTROLE, DE LA PURIFICATION DU GAZ NATUREL ET DU TRAITEMENT PYROLYTIQUE DU CHARBON",
    children: [
      {
        code: "05 01",
        description: "déchets provenant du raffinage du pétrole",
        children: [
          {
            code: "05 01 02*",
            description: "boues de dessalage",
            children: []
          },
          {
            code: "05 01 03*",
            description: "boues de fond de cuves",
            children: []
          },
          {
            code: "05 01 04*",
            description: "boues d'alkyles acides",
            children: []
          },
          {
            code: "05 01 05*",
            description: "hydrocarbures accidentellement répandus",
            children: []
          },
          {
            code: "05 01 06*",
            description:
              "boues contenant des hydrocarbures provenant des opérations de maintenance de l'installation ou des équipements",
            children: []
          },
          {
            code: "05 01 07*",
            description: "goudrons acides",
            children: []
          },
          {
            code: "05 01 08*",
            description: "autres goudrons",
            children: []
          },
          {
            code: "05 01 09*",
            description:
              "boues provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "05 01 10",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 05 01 09",
            children: []
          },
          {
            code: "05 01 11*",
            description:
              "déchets provenant du nettoyage d'hydrocarbures avec des bases",
            children: []
          },
          {
            code: "05 01 12*",
            description: "hydrocarbures contenant des acides",
            children: []
          },
          {
            code: "05 01 13",
            description:
              "boues du traitement de l'eau d'alimentation des chaudières",
            children: []
          },
          {
            code: "05 01 14",
            description: "déchets provenant des colonnes de refroidissement",
            children: []
          },
          {
            code: "05 01 15*",
            description: "argiles de filtration usées",
            children: []
          },
          {
            code: "05 01 16",
            description:
              "déchets contenant du soufre provenant de la désulfuration du pétrole",
            children: []
          },
          {
            code: "05 01 17",
            description: "mélanges bitumineux",
            children: []
          },
          {
            code: "05 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "05 06",
        description: "déchets provenant du traitement pyrolytique du charbon",
        children: [
          {
            code: "05 06 01*",
            description: "goudrons acides",
            children: []
          },
          {
            code: "05 06 03*",
            description: "autres goudrons",
            children: []
          },
          {
            code: "05 06 04",
            description: "déchets provenant des colonnes de refroidissement",
            children: []
          },
          {
            code: "05 06 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "05 07",
        description:
          "déchets provenant de la purification et du transport du gaz naturel",
        children: [
          {
            code: "05 07 01*",
            description: "déchets contenant du mercure",
            children: []
          },
          {
            code: "05 07 02",
            description: "déchets contenant du soufre",
            children: []
          },
          {
            code: "05 07 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "06",
    description: "DÉCHETS DES PROCÉDÉS DE LA CHIMIE MINÉRALE",
    children: [
      {
        code: "06 01",
        description:
          "déchets provenant de la fabrication, formulation, distribution et utilisation (FFDU) d'acides",
        children: [
          {
            code: "06 01 01*",
            description: "acide sulfurique et acide sulfureux",
            children: []
          },
          {
            code: "06 01 02*",
            description: "acide chlorhydrique",
            children: []
          },
          {
            code: "06 01 03*",
            description: "acide fluorhydrique",
            children: []
          },
          {
            code: "06 01 04*",
            description: "acide phosphorique et acide phosphoreux",
            children: []
          },
          {
            code: "06 01 05*",
            description: "acide nitrique et acide nitreux",
            children: []
          },
          {
            code: "06 01 06*",
            description: "autres acides",
            children: []
          },
          {
            code: "06 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "06 02",
        description: "déchets provenant de la FFDU de bases",
        children: [
          {
            code: "06 02 01*",
            description: "hydroxyde de calcium",
            children: []
          },
          {
            code: "06 02 03*",
            description: "hydroxyde d'ammonium",
            children: []
          },
          {
            code: "06 02 04*",
            description: "hydroxyde de sodium et hydroxyde de potassium",
            children: []
          },
          {
            code: "06 02 05*",
            description: "autres bases",
            children: []
          },
          {
            code: "06 02 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "06 03",
        description:
          "déchets provenant de la FFDU de sels et leurs solutions et d'oxydes métalliques",
        children: [
          {
            code: "06 03 11*",
            description: "sels et solutions contenant des cyanures",
            children: []
          },
          {
            code: "06 03 13*",
            description: "sels et solutions contenant des métaux lourds",
            children: []
          },
          {
            code: "06 03 14",
            description:
              "sels solides et solutions autres que ceux visés aux rubriques 06 03 11 et 06 03 13",
            children: []
          },
          {
            code: "06 03 15*",
            description: "oxydes métalliques contenant des métaux lourds",
            children: []
          },
          {
            code: "06 03 16",
            description:
              "oxydes métalliques autres que ceux visés à la rubrique 06 03 15",
            children: []
          },
          {
            code: "06 03 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "06 04",
        description:
          "déchets contenant des métaux autres que ceux visés à la section 06 03",
        children: [
          {
            code: "06 04 03*",
            description: "déchets contenant de l'arsenic",
            children: []
          },
          {
            code: "06 04 04*",
            description: "déchets contenant du mercure",
            children: []
          },
          {
            code: "06 04 05*",
            description: "déchets contenant d'autres métaux lourds",
            children: []
          },
          {
            code: "06 04 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "06 05",
        description: "boues provenant du traitement in situ des effluents",
        children: [
          {
            code: "06 05 02*",
            description:
              "boues provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "06 05 03",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 06 05 02",
            children: []
          }
        ]
      },
      {
        code: "06 06",
        description:
          "déchets provenant de la FFDU de produits chimiques contenant du soufre, de la chimie du soufre et des procédés de désulfuration",
        children: [
          {
            code: "06 06 02*",
            description: "déchets contenant des sulfures dangereux",
            children: []
          },
          {
            code: "06 06 03",
            description:
              "déchets contenant des sulfures autres que ceux visés à la rubrique 06 06 02",
            children: []
          },
          {
            code: "06 06 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "06 07",
        description:
          "déchets provenant de la FFDU des halogènes et de la chimie des halogènes",
        children: [
          {
            code: "06 07 01*",
            description:
              "déchets contenant de l'amiante provenant de l'électrolyse",
            children: []
          },
          {
            code: "06 07 02*",
            description:
              "déchets de charbon actif utilisé pour la production du chlore",
            children: []
          },
          {
            code: "06 07 03*",
            description: "boues de sulfate de baryum contenant du mercure",
            children: []
          },
          {
            code: "06 07 04*",
            description: "solutions et acides, par exemple acide de contact",
            children: []
          },
          {
            code: "06 07 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "06 08",
        description:
          "déchets provenant de la FFDU du silicium et des dérivés du silicium",
        children: [
          {
            code: "06 08 02*",
            description: "déchets contenant des chlorosilanes dangereux",
            children: []
          },
          {
            code: "06 08 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "06 09",
        description:
          "déchets provenant de la FFDU des produits chimiques contenant du phosphore et de la chimie du phosphore",
        children: [
          {
            code: "06 09 02",
            description: "scories phosphoriques",
            children: []
          },
          {
            code: "06 09 03*",
            description:
              "déchets de réactions basées sur le calcium contenant des substances dangereuses ou contaminées par de telles substances",
            children: []
          },
          {
            code: "06 09 04",
            description:
              "déchets de réactions basées sur le calcium autres que ceux visés à la rubrique 06 09 03",
            children: []
          },
          {
            code: "06 09 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "06 10",
        description:
          "déchets provenant de la FFDU de produits chimiques contenant de l'azote, de la chimie de l'azote et de la production d'engrais",
        children: [
          {
            code: "06 10 02*",
            description: "déchets contenant des substances dangereuses",
            children: []
          },
          {
            code: "06 10 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "06 11",
        description:
          "déchets provenant de la fabrication des pigments inorganiques et des opacifiants",
        children: [
          {
            code: "06 11 01",
            description:
              "déchets de réactions basées sur le calcium provenant de la production de dioxyde de titane",
            children: []
          },
          {
            code: "06 11 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "06 13",
        description:
          "déchets des procédés de la chimie minérale non spécifiés ailleurs",
        children: [
          {
            code: "06 13 01*",
            description:
              "produits phytosanitaires inorganiques, agents de protection du bois et autres biocides",
            children: []
          },
          {
            code: "06 13 02*",
            description: "charbon actif usé (sauf rubrique 06 07 02)",
            children: []
          },
          {
            code: "06 13 03",
            description: "noir de carbone",
            children: []
          },
          {
            code: "06 13 04*",
            description: "déchets provenant de la transformation de l'amiante",
            children: []
          },
          {
            code: "06 13 05*",
            description: "suies",
            children: []
          },
          {
            code: "06 13 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "07",
    description: "DÉCHETS DES PROCÉDÉS DE LA CHIMIE ORGANIQUE",
    children: [
      {
        code: "07 01",
        description:
          "déchets provenant de la fabrication, formulation, distribution et utilisation (FFDU) de produits organiques de base",
        children: [
          {
            code: "07 01 01*",
            description: "eaux de lavage et liqueurs mères aqueuses",
            children: []
          },
          {
            code: "07 01 03*",
            description:
              "solvants, liquides de lavage et liqueurs mères organiques halogénés",
            children: []
          },
          {
            code: "07 01 04*",
            description:
              "autres solvants, liquides de lavage et liqueurs mères organiques",
            children: []
          },
          {
            code: "07 01 07*",
            description:
              "résidus de réaction et résidus de distillation halogénés",
            children: []
          },
          {
            code: "07 01 08*",
            description:
              "autres résidus de réaction et résidus de distillation",
            children: []
          },
          {
            code: "07 01 09*",
            description: "gâteaux de filtration et absorbants usés halogénés",
            children: []
          },
          {
            code: "07 01 10*",
            description: "autres gâteaux de filtration et absorbants usés",
            children: []
          },
          {
            code: "07 01 11*",
            description:
              "boues provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "07 01 12",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 07 01 11",
            children: []
          },
          {
            code: "07 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "07 02",
        description:
          "déchets provenant de la FFDU de matières plastiques, caoutchouc et fibres synthétiques",
        children: [
          {
            code: "07 02 01*",
            description: "eaux de lavage et liqueurs mères aqueuses",
            children: []
          },
          {
            code: "07 02 03*",
            description:
              "solvants, liquides de lavage et liqueurs mères organiques halogénés",
            children: []
          },
          {
            code: "07 02 04*",
            description:
              "autres solvants, liquides de lavage et liqueurs mères organiques",
            children: []
          },
          {
            code: "07 02 07*",
            description:
              "résidus de réaction et résidus de distillation halogénés",
            children: []
          },
          {
            code: "07 02 08*",
            description:
              "autres résidus de réaction et résidus de distillation",
            children: []
          },
          {
            code: "07 02 09*",
            description: "gâteaux de filtration et absorbants usés halogénés",
            children: []
          },
          {
            code: "07 02 10*",
            description: "autres gâteaux de filtration et absorbants usés",
            children: []
          },
          {
            code: "07 02 11*",
            description:
              "boues provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "07 02 12",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 07 02 11",
            children: []
          },
          {
            code: "07 02 13",
            description: "déchets plastiques",
            children: []
          },
          {
            code: "07 02 14*",
            description:
              "déchets provenant d'additifs contenant des substances dangereuses",
            children: []
          },
          {
            code: "07 02 15",
            description:
              "déchets provenant d'additifs autres que ceux visés à la rubrique 07 02 14",
            children: []
          },
          {
            code: "07 02 16*",
            description: "déchets contenant des silicones dangereux",
            children: []
          },
          {
            code: "07 02 17",
            description:
              "déchets contenant des silicones autres que ceux visés à la rubrique 07 02 16",
            children: []
          },
          {
            code: "07 02 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "07 03",
        description:
          "déchets provenant de la FFDU de teintures et pigments organiques (sauf section 06 11)",
        children: [
          {
            code: "07 03 01*",
            description: "eaux de lavage et liqueurs mères aqueuses",
            children: []
          },
          {
            code: "07 03 03*",
            description:
              "solvants, liquides de lavage et liqueurs mères organiques halogénés",
            children: []
          },
          {
            code: "07 03 04*",
            description:
              "autres solvants, liquides de lavage et liqueurs mères organiques",
            children: []
          },
          {
            code: "07 03 07*",
            description:
              "résidus de réaction et résidus de distillation halogénés",
            children: []
          },
          {
            code: "07 03 08*",
            description:
              "autres résidus de réaction et résidus de distillation",
            children: []
          },
          {
            code: "07 03 09*",
            description: "gâteaux de filtration et absorbants usés halogénés",
            children: []
          },
          {
            code: "07 03 10*",
            description: "autres gâteaux de filtration et absorbants usés",
            children: []
          },
          {
            code: "07 03 11*",
            description:
              "boues provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "07 03 12",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 07 03 11",
            children: []
          },
          {
            code: "07 03 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "07 04",
        description:
          "déchets provenant de la FFDU de produits phytosanitaires organiques (sauf rubriques 02 01 08 et 02 01 09), d'agents de protection du bois (sauf section 03 02) et d'autres biocides",
        children: [
          {
            code: "07 04 01*",
            description: "eaux de lavage et liqueurs mères aqueuses",
            children: []
          },
          {
            code: "07 04 03*",
            description:
              "solvants, liquides de lavage et liqueurs mères organiques halogénés",
            children: []
          },
          {
            code: "07 04 04*",
            description:
              "autres solvants, liquides de lavage et liqueurs mères organiques",
            children: []
          },
          {
            code: "07 04 07*",
            description:
              "résidus de réaction et résidus de distillation halogénés",
            children: []
          },
          {
            code: "07 04 08*",
            description:
              "autres résidus de réaction et résidus de distillation",
            children: []
          },
          {
            code: "07 04 09*",
            description: "gâteaux de filtration et absorbants usés halogénés",
            children: []
          },
          {
            code: "07 04 10*",
            description: "autres gâteaux de filtration et absorbants usés",
            children: []
          },
          {
            code: "07 04 11*",
            description:
              "boues provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "07 04 12",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 07 04 11",
            children: []
          },
          {
            code: "07 04 13*",
            description: "déchets solides contenant des substances dangereuses",
            children: []
          },
          {
            code: "07 04 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "07 05",
        description:
          "déchets provenant de la FFDU des produits pharmaceutiques",
        children: [
          {
            code: "07 05 01*",
            description: "eaux de lavage et liqueurs mères aqueuses",
            children: []
          },
          {
            code: "07 05 03*",
            description:
              "solvants, liquides de lavage et liqueurs mères organiques halogénés",
            children: []
          },
          {
            code: "07 05 04*",
            description:
              "autres solvants, liquides de lavage et liqueurs mères organiques",
            children: []
          },
          {
            code: "07 05 07*",
            description:
              "résidus de réaction et résidus de distillation halogénés",
            children: []
          },
          {
            code: "07 05 08*",
            description:
              "autres résidus de réaction et résidus de distillation",
            children: []
          },
          {
            code: "07 05 09*",
            description: "gâteaux de filtration et absorbants usés halogénés",
            children: []
          },
          {
            code: "07 05 10*",
            description: "autres gâteaux de filtration et absorbants usés",
            children: []
          },
          {
            code: "07 05 11*",
            description:
              "boues provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "07 05 12",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 07 05 11",
            children: []
          },
          {
            code: "07 05 13*",
            description: "déchets solides contenant des substances dangereuses",
            children: []
          },
          {
            code: "07 05 14",
            description:
              "déchets solides autres que ceux visés à la rubrique 07 05 13",
            children: []
          },
          {
            code: "07 05 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "07 06",
        description:
          "déchets provenant de la FFDU des corps gras, savons, détergents, désinfectants et cosmétiques",
        children: [
          {
            code: "07 06 01*",
            description: "eaux de lavage et liqueurs mères aqueuses",
            children: []
          },
          {
            code: "07 06 03*",
            description:
              "solvants, liquides de lavage et liqueurs mères organiques halogénés",
            children: []
          },
          {
            code: "07 06 04*",
            description:
              "autres solvants, liquides de lavage et liqueurs mères organiques",
            children: []
          },
          {
            code: "07 06 07*",
            description:
              "résidus de réaction et résidus de distillation halogénés",
            children: []
          },
          {
            code: "07 06 08*",
            description:
              "autres résidus de réaction et résidus de distillation",
            children: []
          },
          {
            code: "07 06 09*",
            description: "gâteaux de filtration et absorbants usés halogénés",
            children: []
          },
          {
            code: "07 06 10*",
            description: "autres gâteaux de filtration et absorbants usés",
            children: []
          },
          {
            code: "07 06 11*",
            description:
              "boues provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "07 06 12",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 07 06 11",
            children: []
          },
          {
            code: "07 06 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "07 07",
        description:
          "déchets provenant de la FFDU de produits chimiques issus de la chimie fine et de produits chimiques non spécifiés ailleurs",
        children: [
          {
            code: "07 07 01*",
            description: "eaux de lavage et liqueurs mères aqueuses",
            children: []
          },
          {
            code: "07 07 03*",
            description:
              "solvants, liquides de lavage et liqueurs mères organiques halogénés",
            children: []
          },
          {
            code: "07 07 04*",
            description:
              "autres solvants, liquides de lavage et liqueurs mères organiques",
            children: []
          },
          {
            code: "07 07 07*",
            description:
              "résidus de réaction et résidus de distillation halogénés",
            children: []
          },
          {
            code: "07 07 08*",
            description:
              "autres résidus de réaction et résidus de distillation",
            children: []
          },
          {
            code: "07 07 09*",
            description: "gâteaux de filtration et absorbants usés halogénés",
            children: []
          },
          {
            code: "07 07 10*",
            description: "autres gâteaux de filtration et absorbants usés",
            children: []
          },
          {
            code: "07 07 11*",
            description:
              "boues provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "07 07 12",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 07 07 11",
            children: []
          },
          {
            code: "07 07 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "08",
    description:
      "DÉCHETS PROVENANT DE LA FABRICATION, DE LA FORMULATION, DE LA DISTRIBUTION ET DE L'UTILISATION (FFDU) DE PRODUITS DE REVÊTEMENT (PEINTURES, VERNIS ET ÉMAUX VITRIFIÉS), MASTICS ET ENCRES D'IMPRESSION",
    children: [
      {
        code: "08 01",
        description:
          "déchets provenant de la FFDU et du décapage de peintures et vernis",
        children: [
          {
            code: "08 01 11*",
            description:
              "déchets de peintures et vernis contenant des solvants organiques ou d'autres substances dangereuses",
            children: []
          },
          {
            code: "08 01 12",
            description:
              "déchets de peintures ou vernis autres que ceux visés à la rubrique 08 01 11",
            children: []
          },
          {
            code: "08 01 13*",
            description:
              "boues provenant de peintures ou vernis contenant des solvants organiques ou autres substances dangereuses",
            children: []
          },
          {
            code: "08 01 14",
            description:
              "boues provenant de peintures ou vernis autres que celles visées à la rubrique 08 01 13",
            children: []
          },
          {
            code: "08 01 15*",
            description:
              "boues aqueuses contenant de la peinture ou du vernis contenant des solvants organiques ou autres substances dangereuses",
            children: []
          },
          {
            code: "08 01 16",
            description:
              "boues aqueuses contenant de la peinture ou du vernis autres que celles visées à la rubrique 08 01 15",
            children: []
          },
          {
            code: "08 01 17*",
            description:
              "déchets provenant du décapage de peintures ou vernis contenant des solvants organiques ou autres substances dangereuses",
            children: []
          },
          {
            code: "08 01 18",
            description:
              "déchets provenant du décapage de peintures ou vernis autres que ceux visés à la rubrique 08 01 17",
            children: []
          },
          {
            code: "08 01 19*",
            description:
              "boues aqueuses contenant de la peinture ou du vernis contenant des solvants organiques ou autres substances dangereuses",
            children: []
          },
          {
            code: "08 01 20",
            description:
              "suspensions aqueuses contenant de la peinture ou du vernis autres que celles visées à la rubrique 08 01 19",
            children: []
          },
          {
            code: "08 01 21*",
            description: "déchets de décapants de peintures ou vernis",
            children: []
          },
          {
            code: "08 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "08 02",
        description:
          "déchets provenant de la FFDU d'autres produits de revêtement (y compris des matériaux céramiques)",
        children: [
          {
            code: "08 02 01",
            description: "déchets de produits de revêtement en poudre",
            children: []
          },
          {
            code: "08 02 02",
            description: "boues aqueuses contenant des matériaux céramiques",
            children: []
          },
          {
            code: "08 02 03",
            description:
              "suspensions aqueuses contenant des matériaux céramiques",
            children: []
          },
          {
            code: "08 02 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "08 03",
        description: "déchets provenant de la FFDU d'encres d'impression",
        children: [
          {
            code: "08 03 07",
            description: "boues aqueuses contenant de l'encre",
            children: []
          },
          {
            code: "08 03 08",
            description: "déchets liquides aqueux contenant de l'encre",
            children: []
          },
          {
            code: "08 03 12*",
            description:
              "déchets d'encres contenant des substances dangereuses",
            children: []
          },
          {
            code: "08 03 13",
            description:
              "déchets d'encres autres que ceux visés à la rubrique 08 03 12",
            children: []
          },
          {
            code: "08 03 14*",
            description: "boues d'encre contenant des substances dangereuses",
            children: []
          },
          {
            code: "08 03 15",
            description:
              "boues d'encre autres que celles visées à la rubrique 08 03 14",
            children: []
          },
          {
            code: "08 03 16*",
            description: "déchets de solution de morsure",
            children: []
          },
          {
            code: "08 03 17*",
            description:
              "déchets de toner d'impression contenant des substances dangereuses",
            children: []
          },
          {
            code: "08 03 18",
            description:
              "déchets de toner d'impression autres que ceux visés à la rubrique 08 03 17",
            children: []
          },
          {
            code: "08 03 19*",
            description: "huiles dispersées",
            children: []
          },
          {
            code: "08 03 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "08 04",
        description:
          "déchets provenant de la FFDU de colles et mastics (y compris produits d'étanchéité)",
        children: [
          {
            code: "08 04 09*",
            description:
              "déchets de colles et mastics contenant des solvants organiques ou d'autres substances dangereuses",
            children: []
          },
          {
            code: "08 04 10",
            description:
              "déchets de colles et mastics autres que ceux visés à la rubrique 08 04 09",
            children: []
          },
          {
            code: "08 04 11*",
            description:
              "boues de colles et mastics contenant des solvants organiques ou d'autres substances dangereuses",
            children: []
          },
          {
            code: "08 04 12",
            description:
              "boues de colles et mastics autres que celles visées à la rubrique 08 04 11",
            children: []
          },
          {
            code: "08 04 13*",
            description:
              "boues aqueuses contenant des colles ou mastics contenant des solvants organiques ou d'autres substances dangereuses",
            children: []
          },
          {
            code: "08 04 14",
            description:
              "boues aqueuses contenant des colles et mastics autres que celles visées à la rubrique 08 04 13",
            children: []
          },
          {
            code: "08 04 15*",
            description:
              "déchets liquides aqueux contenant des colles ou mastics contenant des solvants organiques ou d'autres substances dangereuses",
            children: []
          },
          {
            code: "08 04 16",
            description:
              "déchets liquides aqueux contenant des colles ou mastics autres que ceux visés à la rubrique 08 04 15",
            children: []
          },
          {
            code: "08 04 17*",
            description: "huile de résine",
            children: []
          },
          {
            code: "08 04 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "08 05",
        description: "déchets non spécifiés ailleurs dans le chapitre 08",
        children: [
          {
            code: "08 05 01*",
            description: "déchets d'isocyanates",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "09",
    description: "DÉCHETS PROVENANT DE L'INDUSTRIE PHOTOGRAPHIQUE",
    children: [
      {
        code: "09 01",
        description: "déchets de l'industrie photographique",
        children: [
          {
            code: "09 01 01*",
            description:
              "bains de développement aqueux contenant un activateur",
            children: []
          },
          {
            code: "09 01 02*",
            description: "bains de développement aqueux pour plaques offset",
            children: []
          },
          {
            code: "09 01 03*",
            description: "bains de développement contenant des solvants",
            children: []
          },
          {
            code: "09 01 04*",
            description: "bains de fixation",
            children: []
          },
          {
            code: "09 01 05*",
            description:
              "bains de blanchiment et bains de blanchiment/fixation",
            children: []
          },
          {
            code: "09 01 06*",
            description:
              "déchets contenant de l'argent provenant du traitement in situ des déchets photographiques",
            children: []
          },
          {
            code: "09 01 07",
            description:
              "pellicules et papiers photographiques contenant de l'argent ou des composés de l'argent",
            children: []
          },
          {
            code: "09 01 08",
            description:
              "pellicules et papiers photographiques sans argent ni composés de l'argent",
            children: []
          },
          {
            code: "09 01 10",
            description: "appareils photographiques à usage unique sans piles",
            children: []
          },
          {
            code: "09 01 11*",
            description:
              "appareils photographiques à usage unique contenant des piles visées aux rubriques 16 06 01, 16 06 02 ou 16 06 03",
            children: []
          },
          {
            code: "09 01 12",
            description:
              "appareils photographiques à usage unique contenant des piles autres que ceux visés à la rubrique 09 01 11",
            children: []
          },
          {
            code: "09 01 13*",
            description:
              "déchets liquides aqueux provenant de la récupération in situ de l'argent autres que ceux visés à la rubrique 09 01 06",
            children: []
          },
          {
            code: "09 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "10",
    description: "DÉCHETS PROVENANT DE PROCÉDÉS THERMIQUES",
    children: [
      {
        code: "10 01",
        description:
          "déchets provenant de centrales électriques et autres installations de combustion (sauf chapitre 19)",
        children: [
          {
            code: "10 01 01",
            description:
              "mâchefers, scories et cendres sous chaudière (sauf cendres sous chaudière visées à la rubrique 10 01 04)",
            children: []
          },
          {
            code: "10 01 02",
            description: "cendres volantes de charbon",
            children: []
          },
          {
            code: "10 01 03",
            description: "cendres volantes de tourbe et de bois non traité",
            children: []
          },
          {
            code: "10 01 04*",
            description:
              "cendres volantes et cendres sous chaudière d'hydrocarbures",
            children: []
          },
          {
            code: "10 01 05",
            description:
              "déchets solides de réactions basées sur le calcium, provenant de la désulfuration des gaz de fumée",
            children: []
          },
          {
            code: "10 01 07",
            description:
              "boues de réactions basées sur le calcium, provenant de la désulfuration des gaz de fumée",
            children: []
          },
          {
            code: "10 01 09*",
            description: "acide sulfurique",
            children: []
          },
          {
            code: "10 01 13*",
            description:
              "cendres volantes provenant d'hydrocarbures émulsifiés employés comme combustibles",
            children: []
          },
          {
            code: "10 01 14*",
            description:
              "mâchefers, scories et cendres sous chaudière provenant de la coïncinération contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 01 15",
            description:
              "mâchefers, scories et cendres sous chaudière provenant de la coïncinération autres que ceux visés à la rubrique 10 01 14",
            children: []
          },
          {
            code: "10 01 16*",
            description:
              "cendres volantes provenant de la coïncinération contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 01 17",
            description:
              "cendres volantes provenant de la coïncinération autres que celles visées à la rubrique 10 01 16",
            children: []
          },
          {
            code: "10 01 18*",
            description:
              "déchets provenant de l'épuration des gaz contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 01 19",
            description:
              "déchets provenant de l'épuration des gaz autres que ceux visés aux rubriques 10 01 05, 10 01 07 et 10 01 18",
            children: []
          },
          {
            code: "10 01 20*",
            description:
              "boues provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 01 21",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 10 01 20",
            children: []
          },
          {
            code: "10 01 22*",
            description:
              "boues aqueuses provenant du nettoyage des chaudières contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 01 23",
            description:
              "boues aqueuses provenant du nettoyage des chaudières autres que celles visées à la rubrique 10 01 22",
            children: []
          },
          {
            code: "10 01 24",
            description: "sables provenant de lits fluidisés",
            children: []
          },
          {
            code: "10 01 25",
            description:
              "déchets provenant du stockage et de la préparation des combustibles des centrales à charbon",
            children: []
          },
          {
            code: "10 01 26",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement",
            children: []
          },
          {
            code: "10 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 02",
        description: "déchets provenant de l'industrie du fer et de l'acier",
        children: [
          {
            code: "10 02 01",
            description: "déchets de laitiers de hauts fourneaux et d'aciéries",
            children: []
          },
          {
            code: "10 02 02",
            description: "laitiers non traités",
            children: []
          },
          {
            code: "10 02 07*",
            description:
              "déchets solides provenant de l'épuration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 02 08",
            description:
              "déchets solides provenant de l'épuration des fumées autres que ceux visés à la rubrique 10 02 07",
            children: []
          },
          {
            code: "10 02 10",
            description: "battitures de laminoir",
            children: []
          },
          {
            code: "10 02 11*",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement contenant des hydrocarbures",
            children: []
          },
          {
            code: "10 02 12",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement autres que ceux visés à la rubrique 10 02 11",
            children: []
          },
          {
            code: "10 02 13*",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 02 14",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées autres que ceux visés à la rubrique 10 02 13",
            children: []
          },
          {
            code: "10 02 15",
            description: "autres boues et gâteaux de filtration",
            children: []
          },
          {
            code: "10 02 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 03",
        description: "déchets de la pyrométallurgie de l'aluminium",
        children: [
          {
            code: "10 03 02",
            description: "déchets d'anodes",
            children: []
          },
          {
            code: "10 03 04*",
            description: "scories provenant de la production primaire",
            children: []
          },
          {
            code: "10 03 05",
            description: "déchets d'alumine",
            children: []
          },
          {
            code: "10 03 08*",
            description: "scories salées de seconde fusion",
            children: []
          },
          {
            code: "10 03 09*",
            description: "crasses noires de seconde fusion",
            children: []
          },
          {
            code: "10 03 15*",
            description:
              "écumes inflammables ou émettant, au contact de l'eau, des gaz inflammables en quantités dangereuses",
            children: []
          },
          {
            code: "10 03 16",
            description:
              "écumes autres que celles visées à la rubrique 10 03 15",
            children: []
          },
          {
            code: "10 03 17*",
            description:
              "déchets goudronnés provenant de la fabrication des anodes",
            children: []
          },
          {
            code: "10 03 18",
            description:
              "déchets carbonés provenant de la fabrication des anodes autres que ceux visés à la rubrique 10 03 17",
            children: []
          },
          {
            code: "10 03 19*",
            description:
              "poussières de filtration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 03 20",
            description:
              "poussières de filtration des fumées autres que celles visées à la rubrique 10 03 19",
            children: []
          },
          {
            code: "10 03 21*",
            description:
              "autres fines et poussières (y compris fines de broyage de crasses) contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 03 22",
            description:
              "autres fines et poussières (y compris fines de broyage de crasses) autres que celles visées à la rubrique 10 03 21",
            children: []
          },
          {
            code: "10 03 23*",
            description:
              "déchets solides provenant de l'épuration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 03 24",
            description:
              "déchets solides provenant de l'épuration des fumées autres que ceux visés à la rubrique 10 03 23",
            children: []
          },
          {
            code: "10 03 25*",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 03 26",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées autres que ceux visés à la rubrique 10 03 25",
            children: []
          },
          {
            code: "10 03 27*",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement contenant des hydrocarbures",
            children: []
          },
          {
            code: "10 03 28",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement autres que ceux visés à la rubrique 10 03 27",
            children: []
          },
          {
            code: "10 03 29*",
            description:
              "déchets provenant du traitement des scories salées et du traitement des crasses noires contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 03 30",
            description:
              "déchets provenant du traitement des scories salées et du traitement des crasses noires autres que ceux visés à la rubrique 10 03 29",
            children: []
          },
          {
            code: "10 03 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 04",
        description: "déchets provenant de la pyrométallurgie du plomb",
        children: [
          {
            code: "10 04 01*",
            description:
              "scories provenant de la production primaire et secondaire",
            children: []
          },
          {
            code: "10 04 02*",
            description:
              "crasses et écumes provenant de la production primaire et secondaire",
            children: []
          },
          {
            code: "10 04 03*",
            description: "arséniate de calcium",
            children: []
          },
          {
            code: "10 04 04*",
            description: "poussières de filtration des fumées",
            children: []
          },
          {
            code: "10 04 05*",
            description: "autres fines et poussières",
            children: []
          },
          {
            code: "10 04 06*",
            description: "déchets solides provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "10 04 07*",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "10 04 09*",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement contenant des hydrocarbures",
            children: []
          },
          {
            code: "10 04 10",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement autres que ceux visés à la rubrique 10 04 09",
            children: []
          },
          {
            code: "10 04 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 05",
        description: "déchets provenant de la pyrométallurgie du zinc",
        children: [
          {
            code: "10 05 01",
            description:
              "scories provenant de la production primaire et secondaire",
            children: []
          },
          {
            code: "10 05 03*",
            description: "poussières de filtration des fumées",
            children: []
          },
          {
            code: "10 05 04",
            description: "autres fines et poussières",
            children: []
          },
          {
            code: "10 05 05*",
            description: "déchets solides provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "10 05 06*",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "10 05 08*",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement contenant des hydrocarbures",
            children: []
          },
          {
            code: "10 05 09",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement autres que ceux visés à la rubrique 10 05 08",
            children: []
          },
          {
            code: "10 05 10*",
            description:
              "crasses et écumes inflammables ou émettant, au contact de l'eau, des gaz inflammables en quantités dangereuses",
            children: []
          },
          {
            code: "10 05 11",
            description:
              "crasses et écumes autres que celles visées à la rubrique 10 05 10",
            children: []
          },
          {
            code: "10 05 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 06",
        description: "déchets provenant de la pyrométallurgie du cuivre",
        children: [
          {
            code: "10 06 01",
            description:
              "scories provenant de la production primaire et secondaire",
            children: []
          },
          {
            code: "10 06 02",
            description:
              "crasses et écumes provenant de la production primaire et secondaire",
            children: []
          },
          {
            code: "10 06 03*",
            description: "poussières de filtration des fumées",
            children: []
          },
          {
            code: "10 06 04",
            description: "autres fines et poussières",
            children: []
          },
          {
            code: "10 06 06*",
            description: "déchets solides provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "10 06 07*",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "10 06 09*",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement contenant des hydrocarbures",
            children: []
          },
          {
            code: "10 06 10",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement autres que ceux visés à la rubrique 10 06 09",
            children: []
          },
          {
            code: "10 06 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 07",
        description:
          "déchets provenant de la pyrométallurgie de l'argent, de l'or et du platine",
        children: [
          {
            code: "10 07 01",
            description:
              "scories provenant de la production primaire et secondaire",
            children: []
          },
          {
            code: "10 07 02",
            description:
              "crasses et écumes provenant de la production primaire et secondaire",
            children: []
          },
          {
            code: "10 07 03",
            description: "déchets solides provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "10 07 04",
            description: "autres fines et poussières",
            children: []
          },
          {
            code: "10 07 05",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "10 07 07*",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement contenant des hydrocarbures",
            children: []
          },
          {
            code: "10 07 08",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement autres que ceux visés à la rubrique 10 07 07",
            children: []
          },
          {
            code: "10 07 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 08",
        description:
          "déchets provenant de la pyrométallurgie d'autres métaux non ferreux",
        children: [
          {
            code: "10 08 04",
            description: "fines et poussières",
            children: []
          },
          {
            code: "10 08 08*",
            description:
              "scories salées provenant de la production primaire et secondaire",
            children: []
          },
          {
            code: "10 08 09",
            description: "autres scories",
            children: []
          },
          {
            code: "10 08 10*",
            description:
              "crasses et écumes inflammables ou émettant, au contact de l'eau, des gaz inflammables en quantités dangereuses",
            children: []
          },
          {
            code: "10 08 11",
            description:
              "crasses et écumes autres que celles visées à la rubrique 10 08 10",
            children: []
          },
          {
            code: "10 08 12*",
            description:
              "déchets goudronnés provenant de la fabrication des anodes",
            children: []
          },
          {
            code: "10 08 13",
            description:
              "déchets carbonés provenant de la fabrication des anodes autres que ceux visés à la rubrique 10 08 12",
            children: []
          },
          {
            code: "10 08 14",
            description: "déchets d'anodes",
            children: []
          },
          {
            code: "10 08 15*",
            description:
              "poussières de filtration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 08 16",
            description:
              "poussières de filtration des fumées autres que celles visées à la rubrique 10 08 15",
            children: []
          },
          {
            code: "10 08 17*",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 08 18",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées autres que ceux visés à la rubrique 10 08 17",
            children: []
          },
          {
            code: "10 08 19*",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement contenant des hydrocarbures",
            children: []
          },
          {
            code: "10 08 20",
            description:
              "déchets provenant de l'épuration des eaux de refroidissement autres que ceux visés à la rubrique 10 08 19",
            children: []
          },
          {
            code: "10 08 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 09",
        description: "déchets de fonderie de métaux ferreux",
        children: [
          {
            code: "10 09 03",
            description: "laitiers de four de fonderie",
            children: []
          },
          {
            code: "10 09 05*",
            description:
              "noyaux et moules de fonderie n'ayant pas subi la coulée contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 09 06",
            description:
              "noyaux et moules de fonderie n'ayant pas subi la coulée autres que ceux visés à la rubrique 10 09 05",
            children: []
          },
          {
            code: "10 09 07*",
            description:
              "noyaux et moules de fonderie ayant subi la coulée contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 09 08",
            description:
              "noyaux et moules de fonderie ayant subi la coulée autres que ceux visés à la rubrique 10 09 07",
            children: []
          },
          {
            code: "10 09 09*",
            description:
              "poussières de filtration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 09 10",
            description:
              "poussières de filtration des fumées autres que celles visées à la rubrique 10 09 09",
            children: []
          },
          {
            code: "10 09 11*",
            description: "autres fines contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 09 12",
            description: "autres fines non visées à la rubrique 10 09 11",
            children: []
          },
          {
            code: "10 09 13*",
            description:
              "déchets de liants contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 09 14",
            description:
              "déchets de liants autres que ceux visés à la rubrique 10 09 13",
            children: []
          },
          {
            code: "10 09 15*",
            description:
              "révélateur de criques usagé contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 09 16",
            description:
              "révélateur de criques usagé autre que celui visé à la rubrique 10 09 15",
            children: []
          },
          {
            code: "10 09 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 10",
        description: "déchets de fonderie de métaux non ferreux",
        children: [
          {
            code: "10 10 03",
            description: "laitiers de four de fonderie",
            children: []
          },
          {
            code: "10 10 05*",
            description:
              "noyaux et moules de fonderie n'ayant pas subi la coulée contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 10 06",
            description:
              "noyaux et moules de fonderie n'ayant pas subi la coulée autres que ceux visés à la rubrique 10 10 05",
            children: []
          },
          {
            code: "10 10 07*",
            description:
              "noyaux et moules de fonderie ayant subi la coulée contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 10 08",
            description:
              "noyaux et moules de fonderie ayant subi la coulée autres que ceux visés à la rubrique 10 10 07",
            children: []
          },
          {
            code: "10 10 09*",
            description:
              "poussières de filtration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 10 10",
            description:
              "poussières de filtration des fumées autres que celles visées à la rubrique 10 10 09",
            children: []
          },
          {
            code: "10 10 11*",
            description: "autres fines contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 10 12",
            description: "autres fines non visées à la rubrique 10 10 11",
            children: []
          },
          {
            code: "10 10 13*",
            description:
              "déchets de liants contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 10 14",
            description:
              "déchets de liants autres que ceux visés à la rubrique 10 10 13",
            children: []
          },
          {
            code: "10 10 15*",
            description:
              "révélateur de criques usagé contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 10 16",
            description:
              "révélateur de criques usagé autre que celui visé à la rubrique 10 10 15",
            children: []
          },
          {
            code: "10 10 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 11",
        description:
          "déchets provenant de la fabrication du verre et des produits verriers",
        children: [
          {
            code: "10 11 03",
            description: "déchets de matériaux à base de fibre de verre",
            children: []
          },
          {
            code: "10 11 05",
            description: "fines et poussières",
            children: []
          },
          {
            code: "10 11 09*",
            description:
              "déchets de préparation avant cuisson contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 11 10",
            description:
              "déchets de préparation avant cuisson autres que ceux visés à la rubrique 10 11 09",
            children: []
          },
          {
            code: "10 11 11*",
            description:
              "petites particules de déchets de verre et poudre de verre contenant des métaux lourds (par exemple tubes cathodiques)",
            children: []
          },
          {
            code: "10 11 12",
            description:
              "déchets de verre autres que ceux visés à la rubrique 10 11 11",
            children: []
          },
          {
            code: "10 11 13*",
            description:
              "boues de polissage et de meulage du verre contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 11 14",
            description:
              "boues de polissage et de meulage du verre autres que celles visées à la rubrique 10 11 13",
            children: []
          },
          {
            code: "10 11 15*",
            description:
              "déchets solides provenant de l'épuration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 11 16",
            description:
              "déchets solides provenant de l'épuration des fumées autres que ceux visés à la rubrique 10 11 15",
            children: []
          },
          {
            code: "10 11 17*",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 11 18",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées autres que ceux visés à la rubrique 10 11 17",
            children: []
          },
          {
            code: "10 11 19*",
            description:
              "déchets solides provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 11 20",
            description:
              "déchets solides provenant du traitement in situ des effluents autres que ceux visés à la rubrique 10 11 19",
            children: []
          },
          {
            code: "10 11 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 12",
        description:
          "déchets provenant de la fabrication des produits en céramique, briques, carrelage et matériaux de construction",
        children: [
          {
            code: "10 12 01",
            description: "déchets de préparation avant cuisson",
            children: []
          },
          {
            code: "10 12 03",
            description: "fines et poussières",
            children: []
          },
          {
            code: "10 12 05",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "10 12 06",
            description: "moules déclassés",
            children: []
          },
          {
            code: "10 12 08",
            description:
              "déchets de produits en céramique, briques, carrelage et matériaux de construction (après cuisson)",
            children: []
          },
          {
            code: "10 12 09*",
            description:
              "déchets solides provenant de l'épuration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 12 10",
            description:
              "déchets solides provenant de l'épuration des fumées autres que ceux visés à la rubrique 10 12 09",
            children: []
          },
          {
            code: "10 12 11*",
            description: "déchets de glaçure contenant des métaux lourds",
            children: []
          },
          {
            code: "10 12 12",
            description:
              "déchets de glaçure autres que ceux visés à la rubrique 10 12 11",
            children: []
          },
          {
            code: "10 12 13",
            description: "boues provenant du traitement in situ des effluents",
            children: []
          },
          {
            code: "10 12 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 13",
        description:
          "déchets provenant de la fabrication de ciment, chaux et plâtre et d'articles et produits dérivés",
        children: [
          {
            code: "10 13 01",
            description: "déchets de préparation avant cuisson",
            children: []
          },
          {
            code: "10 13 04",
            description: "déchets de calcination et d'hydratation de la chaux",
            children: []
          },
          {
            code: "10 13 06",
            description:
              "fines et poussières (sauf rubriques 10 13 12 et 10 13 13)",
            children: []
          },
          {
            code: "10 13 07",
            description:
              "boues et gâteaux de filtration provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "10 13 09*",
            description:
              "déchets provenant de la fabrication d'amiante-ciment contenant de l'amiante",
            children: []
          },
          {
            code: "10 13 10",
            description:
              "déchets provenant de la fabrication d'amiante-ciment autres que ceux visés à la rubrique 10 13 09",
            children: []
          },
          {
            code: "10 13 11",
            description:
              "déchets provenant de la fabrication de matériaux composites à base de ciment autres que ceux visés aux rubriques 10 13 09 et 10 13 10",
            children: []
          },
          {
            code: "10 13 12*",
            description:
              "déchets solides provenant de l'épuration des fumées contenant des substances dangereuses",
            children: []
          },
          {
            code: "10 13 13",
            description:
              "déchets solides provenant de l'épuration des fumées autres que ceux visés à la rubrique 10 13 12",
            children: []
          },
          {
            code: "10 13 14",
            description: "déchets et boues de béton",
            children: []
          },
          {
            code: "10 13 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "10 14",
        description: "déchets de crématoires",
        children: [
          {
            code: "10 14 01*",
            description:
              "déchets provenant de l'épuration des fumées contenant du mercure",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "11",
    description:
      "DÉCHETS PROVENANT DU TRAITEMENT CHIMIQUE DE SURFACE ET DU REVÊTEMENT DES MÉTAUX ET AUTRES MATÉRIAUX, ET DE L'HYDROMÉTALLURGIE DES MÉTAUX NON FERREUX",
    children: [
      {
        code: "11 01",
        description:
          "déchets provenant du traitement chimique de surface et du revêtement des métaux et autres matériaux (par exemple, procédés de galvanisation, de revêtement de zinc, de décapage, de gravure, de phosphatation, de dégraissage alcalin et d'anodisation)",
        children: [
          {
            code: "11 01 05*",
            description: "acides de décapage",
            children: []
          },
          {
            code: "11 01 06*",
            description: "acides non spécifiés ailleurs",
            children: []
          },
          {
            code: "11 01 07*",
            description: "bases de décapage",
            children: []
          },
          {
            code: "11 01 08*",
            description: "boues de phosphatation",
            children: []
          },
          {
            code: "11 01 09*",
            description:
              "boues et gâteaux de filtration contenant des substances dangereuses",
            children: []
          },
          {
            code: "11 01 10",
            description:
              "boues et gâteaux de filtration autres que ceux visés à la rubrique 11 01 09",
            children: []
          },
          {
            code: "11 01 11*",
            description:
              "liquides aqueux de rinçage contenant des substances dangereuses",
            children: []
          },
          {
            code: "11 01 12",
            description:
              "liquides aqueux de rinçage autres que ceux visés à la rubrique 11 01 11",
            children: []
          },
          {
            code: "11 01 13*",
            description:
              "déchets de dégraissage contenant des substances dangereuses",
            children: []
          },
          {
            code: "11 01 14",
            description:
              "déchets de dégraissage autres que ceux visés à la rubrique 11 01 13",
            children: []
          },
          {
            code: "11 01 15*",
            description:
              "éluats et boues provenant des systèmes à membrane et des systèmes d'échange d'ions contenant des substances dangereuses",
            children: []
          },
          {
            code: "11 01 16*",
            description: "résines échangeuses d'ions saturées ou usées",
            children: []
          },
          {
            code: "11 01 98*",
            description: "autres déchets contenant des substances dangereuses",
            children: []
          },
          {
            code: "11 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "11 02",
        description:
          "déchets provenant des procédés hydrométallurgiques des métaux non ferreux",
        children: [
          {
            code: "11 02 02*",
            description:
              "boues provenant de l'hydrométallurgie du zinc (y compris jarosite et goethite)",
            children: []
          },
          {
            code: "11 02 03",
            description:
              "déchets provenant de la production d'anodes pour les procédés d'électrolyse aqueuse",
            children: []
          },
          {
            code: "11 02 05*",
            description:
              "déchets provenant des procédés hydrométallurgiques du cuivre contenant des substances dangereuses",
            children: []
          },
          {
            code: "11 02 06",
            description:
              "déchets provenant des procédés hydrométallurgiques du cuivre autres que ceux visés à la rubrique 11 02 05",
            children: []
          },
          {
            code: "11 02 07*",
            description: "autres déchets contenant des substances dangereuses",
            children: []
          },
          {
            code: "11 02 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "11 03",
        description: "boues et solides provenant de la trempe",
        children: [
          {
            code: "11 03 01*",
            description: "déchets cyanurés",
            children: []
          },
          {
            code: "11 03 02*",
            description: "autres déchets",
            children: []
          }
        ]
      },
      {
        code: "11 05",
        description: "déchets provenant de la galvanisation à chaud",
        children: [
          {
            code: "11 05 01",
            description: "mattes",
            children: []
          },
          {
            code: "11 05 02",
            description: "cendres de zinc",
            children: []
          },
          {
            code: "11 05 03*",
            description: "déchets solides provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "11 05 04*",
            description: "flux utilisé",
            children: []
          },
          {
            code: "11 05 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "12",
    description:
      "DÉCHETS PROVENANT DE LA MISE EN FORME ET DU TRAITEMENT PHYSIQUE ET MÉCANIQUE DE SURFACE DES MÉTAUX ET MATIÈRES PLASTIQUES",
    children: [
      {
        code: "12 01",
        description:
          "déchets provenant de la mise en forme et du traitement mécanique et physique de surface des métaux et matières plastiques",
        children: [
          {
            code: "12 01 01",
            description: "limaille et chutes de métaux ferreux",
            children: []
          },
          {
            code: "12 01 02",
            description: "fines et poussières de métaux ferreux",
            children: []
          },
          {
            code: "12 01 03",
            description: "limaille et chutes de métaux non ferreux",
            children: []
          },
          {
            code: "12 01 04",
            description: "fines et poussières de métaux non ferreux",
            children: []
          },
          {
            code: "12 01 05",
            description:
              "déchets de matières plastiques d'ébarbage et de tournage",
            children: []
          },
          {
            code: "12 01 06*",
            description:
              "huiles d'usinage à base minérale contenant des halogènes (pas sous forme d'émulsions ou de solutions)",
            children: []
          },
          {
            code: "12 01 07*",
            description:
              "huiles d'usinage à base minérale sans halogènes (pas sous forme d'émulsions ou de solutions)",
            children: []
          },
          {
            code: "12 01 08*",
            description:
              "émulsions et solutions d'usinage contenant des halogènes",
            children: []
          },
          {
            code: "12 01 09*",
            description: "émulsions et solutions d'usinage sans halogènes",
            children: []
          },
          {
            code: "12 01 10*",
            description: "huiles d'usinage de synthèse",
            children: []
          },
          {
            code: "12 01 12*",
            description: "déchets de cires et graisses",
            children: []
          },
          {
            code: "12 01 13",
            description: "déchets de soudure",
            children: []
          },
          {
            code: "12 01 14*",
            description: "boues d'usinage contenant des substances dangereuses",
            children: []
          },
          {
            code: "12 01 15",
            description:
              "boues d'usinage autres que celles visées à la rubrique 12 01 14",
            children: []
          },
          {
            code: "12 01 16*",
            description:
              "déchets de grenaillage contenant des substances dangereuses",
            children: []
          },
          {
            code: "12 01 17",
            description:
              "déchets de grenaillage autres que ceux visés à la rubrique 12 01 16",
            children: []
          },
          {
            code: "12 01 18*",
            description:
              "boues métalliques (provenant du meulage et de l'affûtage) contenant des hydrocarbures",
            children: []
          },
          {
            code: "12 01 19*",
            description: "huiles d'usinage facilement biodégradables",
            children: []
          },
          {
            code: "12 01 20*",
            description:
              "déchets de meulage et matériaux de meulage contenant des substances dangereuses",
            children: []
          },
          {
            code: "12 01 21",
            description:
              "déchets de meulage et matériaux de meulage autres que ceux visés à la rubrique 12 01 20",
            children: []
          },
          {
            code: "12 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "12 03",
        description:
          "déchets provenant du dégraissage à l'eau et à la vapeur (sauf chapitre 11)",
        children: [
          {
            code: "12 03 01*",
            description: "liquides aqueux de nettoyage",
            children: []
          },
          {
            code: "12 03 02*",
            description: "déchets du dégraissage à la vapeur",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "13",
    description:
      "HUILES ET COMBUSTIBLES LIQUIDES USAGÉS (sauf huiles alimentaires et huiles figurant aux chapitres 05, 12 et 19)",
    children: [
      {
        code: "13 01",
        description: "huiles hydrauliques usagées",
        children: [
          {
            code: "13 01 01*",
            description: "huiles hydrauliques contenant des PCB",
            children: []
          },
          {
            code: "13 01 04*",
            description: "huiles hydrauliques chlorées (émulsions)",
            children: []
          },
          {
            code: "13 01 05*",
            description: "huiles hydrauliques non chlorées (émulsions)",
            children: []
          },
          {
            code: "13 01 09*",
            description: "huiles hydrauliques chlorées à base minérale",
            children: []
          },
          {
            code: "13 01 10*",
            description: "huiles hydrauliques non chlorées à base minérale",
            children: []
          },
          {
            code: "13 01 11*",
            description: "huiles hydrauliques synthétiques",
            children: []
          },
          {
            code: "13 01 12*",
            description: "huiles hydrauliques facilement biodégradables",
            children: []
          },
          {
            code: "13 01 13*",
            description: "autres huiles hydrauliques",
            children: []
          }
        ]
      },
      {
        code: "13 02",
        description:
          "huiles moteur, de boîte de vitesses et de lubrification usagées",
        children: [
          {
            code: "13 02 04*",
            description:
              "huiles moteur, de boîte de vitesses et de lubrification chlorées à base minérale",
            children: []
          },
          {
            code: "13 02 05*",
            description:
              "huiles moteur, de boîte de vitesses et de lubrification non chlorées à base minérale",
            children: []
          },
          {
            code: "13 02 06*",
            description:
              "huiles moteur, de boîte de vitesses et de lubrification synthétiques",
            children: []
          },
          {
            code: "13 02 07*",
            description:
              "huiles moteur, de boîte de vitesses et de lubrification facilement biodégradables",
            children: []
          },
          {
            code: "13 02 08*",
            description:
              "autres huiles moteur, de boîte de vitesses et de lubrification",
            children: []
          }
        ]
      },
      {
        code: "13 03",
        description: "huiles isolantes et fluides caloporteurs usagés",
        children: [
          {
            code: "13 03 01*",
            description:
              "huiles isolantes et fluides caloporteurs contenant des PCB",
            children: []
          },
          {
            code: "13 03 06*",
            description:
              "huiles isolantes et fluides caloporteurs chlorés à base minérale autres que ceux visés à la rubrique 13 03 01",
            children: []
          },
          {
            code: "13 03 07*",
            description:
              "huiles isolantes et fluides caloporteurs non chlorés à base minérale",
            children: []
          },
          {
            code: "13 03 08*",
            description:
              "huiles isolantes et fluides caloporteurs synthétiques",
            children: []
          },
          {
            code: "13 03 09*",
            description:
              "huiles isolantes et fluides caloporteurs facilement biodégradables",
            children: []
          },
          {
            code: "13 03 10*",
            description: "autres huiles isolantes et fluides caloporteurs",
            children: []
          }
        ]
      },
      {
        code: "13 04",
        description: "hydrocarbures de fond de cale",
        children: [
          {
            code: "13 04 01*",
            description:
              "hydrocarbures de fond de cale provenant de la navigation fluviale",
            children: []
          },
          {
            code: "13 04 02*",
            description:
              "hydrocarbures de fond de cale provenant de canalisations de môles",
            children: []
          },
          {
            code: "13 04 03*",
            description:
              "hydrocarbures de fond de cale provenant d'un autre type de navigation",
            children: []
          }
        ]
      },
      {
        code: "13 05",
        description: "contenu de séparateurs eau/hydrocarbures",
        children: [
          {
            code: "13 05 01*",
            description:
              "déchets solides provenant de dessableurs et de séparateurs eau/hydrocarbures",
            children: []
          },
          {
            code: "13 05 02*",
            description: "boues provenant de séparateurs eau/hydrocarbures",
            children: []
          },
          {
            code: "13 05 03*",
            description: "boues provenant de déshuileurs",
            children: []
          },
          {
            code: "13 05 06*",
            description:
              "hydrocarbures provenant de séparateurs eau/hydrocarbures",
            children: []
          },
          {
            code: "13 05 07*",
            description:
              "eau mélangée à des hydrocarbures provenant de séparateurs eau/hydrocarbures",
            children: []
          },
          {
            code: "13 05 08*",
            description:
              "mélanges de déchets provenant de dessableurs et de séparateurs eau/hydrocarbures",
            children: []
          }
        ]
      },
      {
        code: "13 07",
        description: "combustibles liquides usagés",
        children: [
          {
            code: "13 07 01*",
            description: "fuel oil et diesel",
            children: []
          },
          {
            code: "13 07 02*",
            description: "essence",
            children: []
          },
          {
            code: "13 07 03*",
            description: "autres combustibles (y compris mélanges)",
            children: []
          }
        ]
      },
      {
        code: "13 08",
        description: "huiles usagées non spécifiées ailleurs",
        children: [
          {
            code: "13 08 01*",
            description: "boues ou émulsions de dessalage",
            children: []
          },
          {
            code: "13 08 02*",
            description: "autres émulsions",
            children: []
          },
          {
            code: "13 08 99*",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "14",
    description:
      "DÉCHETS DE SOLVANTS ORGANIQUES, D'AGENTS RÉFRIGÉRANTS ET PROPULSEURS (sauf chapitres 07 et 08)",
    children: [
      {
        code: "14 06",
        description:
          "déchets de solvants, d'agents réfrigérants et d'agents propulseurs d'aérosols/de mousses organiques",
        children: [
          {
            code: "14 06 01*",
            description: "chlorofluorocarbones, HCFC, HFC",
            children: []
          },
          {
            code: "14 06 02*",
            description: "autres solvants et mélanges de solvants halogénés",
            children: []
          },
          {
            code: "14 06 03*",
            description: "autres solvants et mélanges de solvants",
            children: []
          },
          {
            code: "14 06 04*",
            description:
              "boues ou déchets solides contenant des solvants halogénés",
            children: []
          },
          {
            code: "14 06 05*",
            description: "boues ou déchets solides contenant d'autres solvants",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "15",
    description:
      "EMBALLAGES ET DÉCHETS D'EMBALLAGES, ABSORBANTS, CHIFFONS D'ESSUYAGE, MATÉRIAUX FILTRANTS ET VÊTEMENTS DE PROTECTION NON SPÉCIFIÉS AILLEURS",
    children: [
      {
        code: "15 01",
        description:
          "emballages et déchets d'emballages (y compris les déchets d'emballages municipaux collectés séparément)",
        children: [
          {
            code: "15 01 01",
            description: "emballages en papier/carton",
            children: []
          },
          {
            code: "15 01 02",
            description: "emballages en matières plastiques",
            children: []
          },
          {
            code: "15 01 03",
            description: "emballages en bois",
            children: []
          },
          {
            code: "15 01 04",
            description: "emballages métalliques",
            children: []
          },
          {
            code: "15 01 05",
            description: "emballages composites",
            children: []
          },
          {
            code: "15 01 06",
            description: "emballages en mélange",
            children: []
          },
          {
            code: "15 01 07",
            description: "emballages en verre",
            children: []
          },
          {
            code: "15 01 09",
            description: "emballages textiles",
            children: []
          },
          {
            code: "15 01 10*",
            description:
              "emballages contenant des résidus de substances dangereuses ou contaminés par de tels résidus",
            children: []
          },
          {
            code: "15 01 11*",
            description:
              "emballages métalliques contenant une matrice poreuse solide dangereuse (par exemple amiante), y compris des conteneurs à pression vides",
            children: []
          }
        ]
      },
      {
        code: "15 02",
        description:
          "absorbants, matériaux filtrants, chiffons d'essuyage et vêtements de protection",
        children: [
          {
            code: "15 02 02*",
            description:
              "absorbants, matériaux filtrants (y compris les filtres à huile non spécifiés ailleurs), chiffons d'essuyage et vêtements de protection contaminés par des substances dangereuses",
            children: []
          },
          {
            code: "15 02 03",
            description:
              "absorbants, matériaux filtrants, chiffons d'essuyage et vêtements de protection autres que ceux visés à la rubrique 15 02 02",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "16",
    description: "DÉCHETS NON DÉCRITS AILLEURS DANS LA LISTE",
    children: [
      {
        code: "16 01",
        description:
          "véhicules hors d'usage de différents moyens de transport (y compris machines tous terrains) et déchets provenant du démontage de véhicules hors d'usage et de l'entretien de véhicules (sauf chapitres 13, 14, et sections 16 06 et 16 08)",
        children: [
          {
            code: "16 01 03",
            description: "pneus hors d'usage",
            children: []
          },
          {
            code: "16 01 04*",
            description: "véhicules hors d'usage",
            children: []
          },
          {
            code: "16 01 06",
            description:
              "véhicules hors d'usage ne contenant ni liquides ni autres composants dangereux",
            children: []
          },
          {
            code: "16 01 07*",
            description: "filtres à huile",
            children: []
          },
          {
            code: "16 01 08*",
            description: "composants contenant du mercure",
            children: []
          },
          {
            code: "16 01 09*",
            description: "composants contenant des PCB",
            children: []
          },
          {
            code: "16 01 10*",
            description:
              "composants explosifs (par exemple coussins gonflables de sécurité)",
            children: []
          },
          {
            code: "16 01 11*",
            description: "patins de freins contenant de l'amiante",
            children: []
          },
          {
            code: "16 01 12",
            description:
              "patins de freins autres que ceux visés à la rubrique 16 01 11",
            children: []
          },
          {
            code: "16 01 13*",
            description: "liquides de frein",
            children: []
          },
          {
            code: "16 01 14*",
            description: "antigels contenant des substances dangereuses",
            children: []
          },
          {
            code: "16 01 15",
            description:
              "antigels autres que ceux visés à la rubrique 16 01 14",
            children: []
          },
          {
            code: "16 01 16",
            description: "réservoirs de gaz liquéfié",
            children: []
          },
          {
            code: "16 01 17",
            description: "métaux ferreux",
            children: []
          },
          {
            code: "16 01 18",
            description: "métaux non ferreux",
            children: []
          },
          {
            code: "16 01 19",
            description: "matières plastiques",
            children: []
          },
          {
            code: "16 01 20",
            description: "verre",
            children: []
          },
          {
            code: "16 01 21*",
            description:
              "composants dangereux autres que ceux visés aux rubriques 16 01 07 à 16 01 11, 16 01 13 et 16 01 14",
            children: []
          },
          {
            code: "16 01 22",
            description: "composants non spécifiés ailleurs",
            children: []
          },
          {
            code: "16 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "16 02",
        description:
          "déchets provenant d'équipements électriques ou électroniques",
        children: [
          {
            code: "16 02 09*",
            description: "transformateurs et accumulateurs contenant des PCB",
            children: []
          },
          {
            code: "16 02 10*",
            description:
              "équipements mis au rebut contenant des PCB ou contaminés par de telles substances autres que ceux visés à la rubrique 16 02 09",
            children: []
          },
          {
            code: "16 02 11*",
            description:
              "équipements mis au rebut contenant des chlorofluorocarbones, des HCFC ou des HFC",
            children: []
          },
          {
            code: "16 02 12*",
            description:
              "équipements mis au rebut contenant de l'amiante libre",
            children: []
          },
          {
            code: "16 02 13*",
            description:
              "équipements mis au rebut contenant des composants dangereux (3) autres que ceux visés aux rubriques 16 02 09 à 16 02 12",
            children: []
          },
          {
            code: "16 02 14",
            description:
              "équipements mis au rebut autres que ceux visés aux rubriques 16 02 09 à 16 02 13",
            children: []
          },
          {
            code: "16 02 15*",
            description:
              "composants dangereux retirés des équipements mis au rebut",
            children: []
          },
          {
            code: "16 02 16",
            description:
              "composants retirés des équipements mis au rebut autres que ceux visés à la rubrique 16 02 15",
            children: []
          }
        ]
      },
      {
        code: "16 03",
        description: "loupés de fabrication et produits non utilisés",
        children: [
          {
            code: "16 03 03*",
            description:
              "déchets d'origine minérale contenant des substances dangereuses",
            children: []
          },
          {
            code: "16 03 04",
            description:
              "déchets d'origine minérale autres que ceux visés à la rubrique 16 03 03",
            children: []
          },
          {
            code: "16 03 05*",
            description:
              "déchets d'origine organique contenant des substances dangereuses",
            children: []
          },
          {
            code: "16 03 06",
            description:
              "déchets d'origine organique autres que ceux visés à la rubrique 16 03 05",
            children: []
          },
          {
            code: "16 03 07*",
            description: "mercure métallique",
            children: []
          }
        ]
      },
      {
        code: "16 04",
        description: "déchets d'explosifs",
        children: [
          {
            code: "16 04 01*",
            description: "déchets de munitions",
            children: []
          },
          {
            code: "16 04 02*",
            description: "déchets de feux d'artifice",
            children: []
          },
          {
            code: "16 04 03*",
            description: "autres déchets d'explosifs",
            children: []
          }
        ]
      },
      {
        code: "16 05",
        description:
          "gaz en récipients à pression et produits chimiques mis au rebut",
        children: [
          {
            code: "16 05 04*",
            description:
              "gaz en récipients à pression (y compris les halons) contenant des substances dangereuses",
            children: []
          },
          {
            code: "16 05 05",
            description:
              "gaz en récipients à pression autres que ceux visés à la rubrique 16 05 04",
            children: []
          },
          {
            code: "16 05 06*",
            description:
              "produits chimiques de laboratoire à base de ou contenant des substances dangereuses, y compris les mélanges de produits chimiques de laboratoire",
            children: []
          },
          {
            code: "16 05 07*",
            description:
              "produits chimiques d'origine minérale à base de ou contenant des substances dangereuses, mis au rebut",
            children: []
          },
          {
            code: "16 05 08*",
            description:
              "produits chimiques d'origine organique à base de ou contenant des substances dangereuses, mis au rebut",
            children: []
          },
          {
            code: "16 05 09",
            description:
              "produits chimiques mis au rebut autres que ceux visés aux rubriques 16 05 06, 16 05 07 ou 16 05 08",
            children: []
          }
        ]
      },
      {
        code: "16 06",
        description: "piles et accumulateurs",
        children: [
          {
            code: "16 06 01*",
            description: "accumulateurs au plomb",
            children: []
          },
          {
            code: "16 06 02*",
            description: "accumulateurs Ni-Cd",
            children: []
          },
          {
            code: "16 06 03*",
            description: "piles contenant du mercure",
            children: []
          },
          {
            code: "16 06 04",
            description: "piles alcalines (sauf rubrique 16 06 03)",
            children: []
          },
          {
            code: "16 06 05",
            description: "autres piles et accumulateurs",
            children: []
          },
          {
            code: "16 06 06*",
            description:
              "électrolytes de piles et accumulateurs collectés séparément",
            children: []
          }
        ]
      },
      {
        code: "16 07",
        description:
          "déchets provenant du nettoyage de cuves et fûts de stockage et de transport (sauf chapitres 05 et 13)",
        children: [
          {
            code: "16 07 08*",
            description: "déchets contenant des hydrocarbures",
            children: []
          },
          {
            code: "16 07 09*",
            description: "déchets contenant d'autres substances dangereuses",
            children: []
          },
          {
            code: "16 07 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "16 08",
        description: "catalyseurs usés",
        children: [
          {
            code: "16 08 01",
            description:
              "catalyseurs usés contenant de l'or, de l'argent, du rhénium, du rhodium, du palladium, de l'iridium ou du platine (sauf rubrique 16 08 07)",
            children: []
          },
          {
            code: "16 08 02*",
            description:
              "catalyseurs usés contenant des métaux ou composés de métaux de transition dangereux",
            children: []
          },
          {
            code: "16 08 03",
            description:
              "catalyseurs usés contenant des métaux ou composés de métaux de transition non spécifiés ailleurs",
            children: []
          },
          {
            code: "16 08 04",
            description:
              "catalyseurs usés de craquage catalytique sur lit fluide (sauf rubrique 16 08 07)",
            children: []
          },
          {
            code: "16 08 05*",
            description: "catalyseurs usés contenant de l'acide phosphorique",
            children: []
          },
          {
            code: "16 08 06*",
            description: "liquides usés employés comme catalyseurs",
            children: []
          },
          {
            code: "16 08 07*",
            description:
              "catalyseurs usés contaminés par des substances dangereuses",
            children: []
          }
        ]
      },
      {
        code: "16 09",
        description: "substances oxydantes",
        children: [
          {
            code: "16 09 01*",
            description:
              "permanganates, par exemple, permanganate de potassium",
            children: []
          },
          {
            code: "16 09 02*",
            description:
              "chromates, par exemple, chromate de potassium, dichromate de sodium ou de potassium",
            children: []
          },
          {
            code: "16 09 03*",
            description: "peroxydes, par exemple, peroxyde d'hydrogène",
            children: []
          },
          {
            code: "16 09 04*",
            description: "substances oxydantes non spécifiées ailleurs",
            children: []
          }
        ]
      },
      {
        code: "16 10",
        description:
          "déchets liquides aqueux destinés à un traitement hors site",
        children: [
          {
            code: "16 10 01*",
            description:
              "déchets liquides aqueux contenant des substances dangereuses",
            children: []
          },
          {
            code: "16 10 02",
            description:
              "déchets liquides aqueux autres que ceux visés à la rubrique 16 10 01",
            children: []
          },
          {
            code: "16 10 03*",
            description:
              "concentrés aqueux contenant des substances dangereuses",
            children: []
          },
          {
            code: "16 10 04",
            description:
              "concentrés aqueux autres que ceux visés à la rubrique 16 10 03",
            children: []
          }
        ]
      },
      {
        code: "16 11",
        description: "déchets de revêtements de fours et réfractaires",
        children: [
          {
            code: "16 11 01*",
            description:
              "revêtements de fours et réfractaires à base de carbone provenant de procédés métallurgiques contenant des substances dangereuses",
            children: []
          },
          {
            code: "16 11 02",
            description:
              "revêtements de fours et réfractaires à base de carbone provenant de procédés métallurgiques autres que ceux visés à la rubrique 16 11 01",
            children: []
          },
          {
            code: "16 11 03*",
            description:
              "autres revêtements de fours et réfractaires provenant de procédés métallurgiques contenant des substances dangereuses",
            children: []
          },
          {
            code: "16 11 04",
            description:
              "autres revêtements de fours et réfractaires provenant de procédés métallurgiques non visés à la rubrique 16 11 03",
            children: []
          },
          {
            code: "16 11 05*",
            description:
              "revêtements de fours et réfractaires provenant de procédés non métallurgiques contenant des substances dangereuses",
            children: []
          },
          {
            code: "16 11 06",
            description:
              "revêtements de fours et réfractaires provenant de procédés non métallurgiques autres que ceux visés à la rubrique 16 11 05",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "17",
    description:
      "DÉCHETS DE CONSTRUCTION ET DE DÉMOLITION (Y COMPRIS DÉBLAIS PROVENANT DE SITES CONTAMINÉS)",
    children: [
      {
        code: "17 01",
        description: "béton, briques, tuiles et céramiques",
        children: [
          {
            code: "17 01 01",
            description: "béton",
            children: []
          },
          {
            code: "17 01 02",
            description: "briques",
            children: []
          },
          {
            code: "17 01 03",
            description: "tuiles et céramiques",
            children: []
          },
          {
            code: "17 01 06*",
            description:
              "mélanges ou fractions séparées de béton, briques, tuiles et céramiques contenant des substances dangereuses",
            children: []
          },
          {
            code: "17 01 07",
            description:
              "mélanges de béton, briques, tuiles et céramiques autres que ceux visés à la rubrique 17 01 06",
            children: []
          }
        ]
      },
      {
        code: "17 02",
        description: "bois, verre et matières plastiques",
        children: [
          {
            code: "17 02 01",
            description: "bois",
            children: []
          },
          {
            code: "17 02 02",
            description: "verre",
            children: []
          },
          {
            code: "17 02 03",
            description: "matières plastiques",
            children: []
          },
          {
            code: "17 02 04*",
            description:
              "bois, verre et matières plastiques contenant des substances dangereuses ou contaminés par de telles substances",
            children: []
          }
        ]
      },
      {
        code: "17 03",
        description: "mélanges bitumineux, goudron et produits goudronnés",
        children: [
          {
            code: "17 03 01*",
            description: "mélanges bitumineux contenant du goudron",
            children: []
          },
          {
            code: "17 03 02",
            description:
              "mélanges bitumineux autres que ceux visés à la rubrique 17 03 01",
            children: []
          },
          {
            code: "17 03 03*",
            description: "goudron et produits goudronnés",
            children: []
          }
        ]
      },
      {
        code: "17 04",
        description: "métaux (y compris leurs alliages)",
        children: [
          {
            code: "17 04 01",
            description: "cuivre, bronze, laiton",
            children: []
          },
          {
            code: "17 04 02",
            description: "aluminium",
            children: []
          },
          {
            code: "17 04 03",
            description: "plomb",
            children: []
          },
          {
            code: "17 04 04",
            description: "zinc",
            children: []
          },
          {
            code: "17 04 05",
            description: "fer et acier",
            children: []
          },
          {
            code: "17 04 06",
            description: "étain",
            children: []
          },
          {
            code: "17 04 07",
            description: "métaux en mélange",
            children: []
          },
          {
            code: "17 04 09*",
            description:
              "déchets métalliques contaminés par des substances dangereuses",
            children: []
          },
          {
            code: "17 04 10*",
            description:
              "câbles contenant des hydrocarbures, du goudron ou d'autres substances dangereuses",
            children: []
          },
          {
            code: "17 04 11",
            description: "câbles autres que ceux visés à la rubrique 17 04 10",
            children: []
          }
        ]
      },
      {
        code: "17 05",
        description:
          "terres (y compris déblais provenant de sites contaminés), cailloux et boues de dragage",
        children: [
          {
            code: "17 05 03*",
            description:
              "terres et cailloux contenant des substances dangereuses",
            children: []
          },
          {
            code: "17 05 04",
            description:
              "terres et cailloux autres que ceux visés à la rubrique 17 05 03",
            children: []
          },
          {
            code: "17 05 05*",
            description:
              "boues de dragage contenant des substances dangereuses",
            children: []
          },
          {
            code: "17 05 06",
            description:
              "boues de dragage autres que celles visées à la rubrique 17 05 05",
            children: []
          },
          {
            code: "17 05 07*",
            description: "ballast de voie contenant des substances dangereuses",
            children: []
          },
          {
            code: "17 05 08",
            description:
              "ballast de voie autre que celui visé à la rubrique 17 05 07",
            children: []
          }
        ]
      },
      {
        code: "17 06",
        description:
          "matériaux d'isolation et matériaux de construction contenant de l'amiante",
        children: [
          {
            code: "17 06 01*",
            description: "matériaux d'isolation contenant de l'amiante",
            children: []
          },
          {
            code: "17 06 03*",
            description:
              "autres matériaux d'isolation à base de ou contenant des substances dangereuses",
            children: []
          },
          {
            code: "17 06 04",
            description:
              "matériaux d'isolation autres que ceux visés aux rubriques 17 06 01 et 17 06 03",
            children: []
          },
          {
            code: "17 06 05*",
            description: "matériaux de construction contenant de l'amiante",
            children: []
          }
        ]
      },
      {
        code: "17 08",
        description: "matériaux de construction à base de gypse",
        children: [
          {
            code: "17 08 01*",
            description:
              "matériaux de construction à base de gypse contaminés par des substances dangereuses",
            children: []
          },
          {
            code: "17 08 02",
            description:
              "matériaux de construction à base de gypse autres que ceux visés à la rubrique 17 08 01",
            children: []
          }
        ]
      },
      {
        code: "17 09",
        description: "autres déchets de construction et de démolition",
        children: [
          {
            code: "17 09 01*",
            description:
              "déchets de construction et de démolition contenant du mercure",
            children: []
          },
          {
            code: "17 09 02*",
            description:
              "déchets de construction et de démolition contenant des PCB (par exemple, mastics, sols à base de résines, double vitrage, condensateurs, contenant des PCB)",
            children: []
          },
          {
            code: "17 09 03*",
            description:
              "autres déchets de construction et de démolition (y compris en mélange) contenant des substances dangereuses",
            children: []
          },
          {
            code: "17 09 04",
            description:
              "déchets de construction et de démolition en mélange autres que ceux visés aux rubriques 17 09 01, 17 09 02 et 17 09 03",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "18",
    description:
      "DÉCHETS PROVENANT DES SOINS MÉDICAUX OU VÉTÉRINAIRES ET/OU DE LA RECHERCHE ASSOCIÉE (sauf déchets de cuisine et de restauration ne provenant pas directement des soins médicaux)",
    children: [
      {
        code: "18 01",
        description:
          "déchets provenant des maternités, du diagnostic, du traitement ou de la prévention des maladies de l'homme",
        children: [
          {
            code: "18 01 01",
            description: "objets piquants et coupants (sauf rubrique 18 01 03)",
            children: []
          },
          {
            code: "18 01 02",
            description:
              "déchets anatomiques et organes, y compris sacs de sang et réserves de sang (sauf rubrique 18 01 03)",
            children: []
          },
          {
            code: "18 01 03*",
            description:
              "déchets dont la collecte et l'élimination font l'objet de prescriptions particulières vis-à-vis des risques d'infection",
            children: []
          },
          {
            code: "18 01 04",
            description:
              "déchets dont la collecte et l'élimination ne font pas l'objet de prescriptions particulières vis-à-vis des risques d'infection (par exemple vêtements, plâtres, draps, vêtements jetables, langes)",
            children: []
          },
          {
            code: "18 01 06*",
            description:
              "produits chimiques à base de ou contenant des substances dangereuses",
            children: []
          },
          {
            code: "18 01 07",
            description:
              "produits chimiques autres que ceux visés à la rubrique 18 01 06",
            children: []
          },
          {
            code: "18 01 08*",
            description: "médicaments cytotoxiques et cytostatiques",
            children: []
          },
          {
            code: "18 01 09",
            description:
              "médicaments autres que ceux visés à la rubrique 18 01 08",
            children: []
          },
          {
            code: "18 01 10*",
            description: "déchets d'amalgame dentaire",
            children: []
          }
        ]
      },
      {
        code: "18 02",
        description:
          "déchets provenant de la recherche, du diagnostic, du traitement ou de la prévention des maladies des animaux",
        children: [
          {
            code: "18 02 01",
            description: "objets piquants et coupants (sauf rubrique 18 02 02)",
            children: []
          },
          {
            code: "18 02 02*",
            description:
              "déchets dont la collecte et l'élimination font l'objet de prescriptions particulières vis-à-vis des risques d'infection",
            children: []
          },
          {
            code: "18 02 03",
            description:
              "déchets dont la collecte et l'élimination ne font pas l'objet de prescriptions particulières vis-à-vis des risques d'infection",
            children: []
          },
          {
            code: "18 02 05*",
            description:
              "produits chimiques à base de ou contenant des substances dangereuses",
            children: []
          },
          {
            code: "18 02 06",
            description:
              "produits chimiques autres que ceux visés à la rubrique 18 02 05",
            children: []
          },
          {
            code: "18 02 07*",
            description: "médicaments cytotoxiques et cytostatiques",
            children: []
          },
          {
            code: "18 02 08",
            description:
              "médicaments autres que ceux visés à la rubrique 18 02 07",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "19",
    description:
      "DÉCHETS PROVENANT DES INSTALLATIONS DE GESTION DES DÉCHETS, DES STATIONS D'ÉPURATION DES EAUX USÉES HORS SITE ET DE LA PRÉPARATION D'EAU DESTINÉE À LA CONSOMMATION HUMAINE ET D'EAU À USAGE INDUSTRIEL",
    children: [
      {
        code: "19 01",
        description: "déchets de l'incinération ou de la pyrolyse de déchets",
        children: [
          {
            code: "19 01 02",
            description: "déchets de déferraillage des mâchefers",
            children: []
          },
          {
            code: "19 01 05*",
            description:
              "gâteaux de filtration provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "19 01 06*",
            description:
              "déchets liquides aqueux provenant de l'épuration des fumées et autres déchets liquides aqueux",
            children: []
          },
          {
            code: "19 01 07*",
            description: "déchets solides provenant de l'épuration des fumées",
            children: []
          },
          {
            code: "19 01 10*",
            description:
              "charbon actif usé provenant de l'épuration des gaz de fumées",
            children: []
          },
          {
            code: "19 01 11*",
            description: "mâchefers contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 01 12",
            description:
              "mâchefers autres que ceux visés à la rubrique 19 01 11",
            children: []
          },
          {
            code: "19 01 13*",
            description:
              "cendres volantes contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 01 14",
            description:
              "cendres volantes autres que celles visées à la rubrique 19 01 13",
            children: []
          },
          {
            code: "19 01 15*",
            description:
              "cendres sous chaudière contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 01 16",
            description:
              "cendres sous chaudière autres que celles visées à la rubrique 19 01 15",
            children: []
          },
          {
            code: "19 01 17*",
            description:
              "déchets de pyrolyse contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 01 18",
            description:
              "déchets de pyrolyse autres que ceux visés à la rubrique 19 01 17",
            children: []
          },
          {
            code: "19 01 19",
            description: "sables provenant de lits fluidisés",
            children: []
          },
          {
            code: "19 01 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "19 02",
        description:
          "déchets provenant des traitements physico-chimiques des déchets (notamment, déchromatation, décyanuration, neutralisation)",
        children: [
          {
            code: "19 02 03",
            description:
              "déchets prémélangés composés seulement de déchets non dangereux",
            children: []
          },
          {
            code: "19 02 04*",
            description:
              "déchets prémélangés contenant au moins un déchet dangereux",
            children: []
          },
          {
            code: "19 02 05*",
            description:
              "boues provenant des traitements physico-chimiques contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 02 06",
            description:
              "boues provenant des traitements physico-chimiques autres que celles visées à la rubrique 19 02 05",
            children: []
          },
          {
            code: "19 02 07*",
            description:
              "hydrocarbures et concentrés provenant d'une séparation",
            children: []
          },
          {
            code: "19 02 08*",
            description:
              "déchets combustibles liquides contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 02 09*",
            description:
              "déchets combustibles solides contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 02 10",
            description:
              "déchets combustibles autres que ceux visés aux rubriques 19 02 08 et 19 02 09",
            children: []
          },
          {
            code: "19 02 11*",
            description: "autres déchets contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 02 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "19 03",
        description: "déchets stabilisés/solidifiés",
        children: [
          {
            code: "19 03 04*",
            description:
              "déchets marqués comme dangereux partiellement stabilisés, autres que ceux visés à la rubrique 19 03 08",
            children: []
          },
          {
            code: "19 03 05",
            description:
              "déchets stabilisés autres que ceux visés à la rubrique 19 03 04",
            children: []
          },
          {
            code: "19 03 06*",
            description: "déchets catalogués comme dangereux, solidifiés",
            children: []
          },
          {
            code: "19 03 07",
            description:
              "déchets solidifiés autres que ceux visés à la rubrique 19 03 06",
            children: []
          },
          {
            code: "19 03 08*",
            description: "mercure partiellement stabilisé",
            children: []
          }
        ]
      },
      {
        code: "19 04",
        description:
          "déchets vitrifiés et déchets provenant de la vitrification",
        children: [
          {
            code: "19 04 01",
            description: "déchets vitrifiés",
            children: []
          },
          {
            code: "19 04 02*",
            description:
              "cendres volantes et autres déchets du traitement des gaz de fumée",
            children: []
          },
          {
            code: "19 04 03*",
            description: "phase solide non vitrifiée",
            children: []
          },
          {
            code: "19 04 04",
            description:
              "déchets liquides aqueux provenant de la trempe des déchets vitrifiés",
            children: []
          }
        ]
      },
      {
        code: "19 05",
        description: "déchets de compostage",
        children: [
          {
            code: "19 05 01",
            description:
              "fraction non compostée des déchets municipaux et assimilés",
            children: []
          },
          {
            code: "19 05 02",
            description:
              "fraction non compostée des déchets animaux et végétaux",
            children: []
          },
          {
            code: "19 05 03",
            description: "compost déclassé",
            children: []
          },
          {
            code: "19 05 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "19 06",
        description: "déchets provenant du traitement anaérobie des déchets",
        children: [
          {
            code: "19 06 03",
            description:
              "liqueurs provenant du traitement anaérobie des déchets municipaux",
            children: []
          },
          {
            code: "19 06 04",
            description:
              "digestats provenant du traitement anaérobie des déchets municipaux",
            children: []
          },
          {
            code: "19 06 05",
            description:
              "liqueurs provenant du traitement anaérobie des déchets animaux et végétaux",
            children: []
          },
          {
            code: "19 06 06",
            description:
              "digestats provenant du traitement anaérobie des déchets animaux et végétaux",
            children: []
          },
          {
            code: "19 06 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "19 07",
        description: "lixiviats de décharges",
        children: [
          {
            code: "19 07 02*",
            description:
              "lixiviats de décharges contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 07 03",
            description:
              "lixiviats de décharges autres que ceux visés à la rubrique 19 07 02",
            children: []
          }
        ]
      },
      {
        code: "19 08",
        description:
          "déchets provenant d'installations de traitement des eaux usées non spécifiés ailleurs",
        children: [
          {
            code: "19 08 01",
            description: "déchets de dégrillage",
            children: []
          },
          {
            code: "19 08 02",
            description: "déchets de dessablage",
            children: []
          },
          {
            code: "19 08 05",
            description:
              "boues provenant du traitement des eaux usées urbaines",
            children: []
          },
          {
            code: "19 08 06*",
            description: "résines échangeuses d'ions saturées ou usées",
            children: []
          },
          {
            code: "19 08 07*",
            description:
              "solutions et boues provenant de la régénération des échangeurs d'ions",
            children: []
          },
          {
            code: "19 08 08*",
            description:
              "déchets provenant des systèmes à membrane contenant des métaux lourds",
            children: []
          },
          {
            code: "19 08 09",
            description:
              "mélanges de graisse et d'huile provenant de la séparation huile/eaux usées contenant seulement des huiles et graisses alimentaires",
            children: []
          },
          {
            code: "19 08 10*",
            description:
              "mélanges de graisse et d'huile provenant de la séparation huile/eaux usées autres que ceux visés à la rubrique 19 08 09",
            children: []
          },
          {
            code: "19 08 11*",
            description:
              "boues contenant des substances dangereuses provenant du traitement biologique des eaux usées industrielles",
            children: []
          },
          {
            code: "19 08 12",
            description:
              "boues provenant du traitement biologique des eaux usées industrielles autres que celles visées à la rubrique 19 08 11",
            children: []
          },
          {
            code: "19 08 13*",
            description:
              "boues contenant des substances dangereuses provenant d'autres traitements des eaux usées industrielles",
            children: []
          },
          {
            code: "19 08 14",
            description:
              "boues provenant d'autres traitements des eaux usées industrielles autres que celles visées à la rubrique 19 08 13",
            children: []
          },
          {
            code: "19 08 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "19 09",
        description:
          "déchets provenant de la préparation d'eau destinée à la consommation humaine ou d'eau à usage industriel",
        children: [
          {
            code: "19 09 01",
            description:
              "déchets solides de première filtration et de dégrillage",
            children: []
          },
          {
            code: "19 09 02",
            description: "boues de clarification de l'eau",
            children: []
          },
          {
            code: "19 09 03",
            description: "boues de décarbonatation",
            children: []
          },
          {
            code: "19 09 04",
            description: "charbon actif usé",
            children: []
          },
          {
            code: "19 09 05",
            description: "résines échangeuses d'ions saturées ou usées",
            children: []
          },
          {
            code: "19 09 06",
            description:
              "solutions et boues provenant de la régénération des échangeurs d'ions",
            children: []
          },
          {
            code: "19 09 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "19 10",
        description:
          "déchets provenant du broyage de déchets contenant des métaux",
        children: [
          {
            code: "19 10 01",
            description: "déchets de fer ou d'acier",
            children: []
          },
          {
            code: "19 10 02",
            description: "déchets de métaux non ferreux",
            children: []
          },
          {
            code: "19 10 03*",
            description:
              "fraction légère des résidus de broyage et poussières contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 10 04",
            description:
              "fraction légère des résidus de broyage et poussières autres que celles visées à la rubrique 19 10 03",
            children: []
          },
          {
            code: "19 10 05*",
            description:
              "autres fractions contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 10 06",
            description:
              "autres fractions autres que celles visées à la rubrique 19 10 05",
            children: []
          }
        ]
      },
      {
        code: "19 11",
        description: "déchets provenant de la régénération de l'huile",
        children: [
          {
            code: "19 11 01*",
            description: "argiles de filtration usées",
            children: []
          },
          {
            code: "19 11 02*",
            description: "goudrons acides",
            children: []
          },
          {
            code: "19 11 03*",
            description: "déchets liquides aqueux",
            children: []
          },
          {
            code: "19 11 04*",
            description:
              "déchets provenant du nettoyage d'hydrocarbures avec des bases",
            children: []
          },
          {
            code: "19 11 05*",
            description:
              "boues provenant du traitement in situ des effluents contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 11 06",
            description:
              "boues provenant du traitement in situ des effluents autres que celles visées à la rubrique 19 11 05",
            children: []
          },
          {
            code: "19 11 07*",
            description:
              "déchets provenant de l'épuration des gaz de combustion",
            children: []
          },
          {
            code: "19 11 99",
            description: "déchets non spécifiés ailleurs",
            children: []
          }
        ]
      },
      {
        code: "19 12",
        description:
          "déchets provenant du traitement mécanique des déchets (par exemple, tri, broyage, compactage, granulation) non spécifiés ailleurs",
        children: [
          {
            code: "19 12 01",
            description: "papier et carton",
            children: []
          },
          {
            code: "19 12 02",
            description: "métaux ferreux",
            children: []
          },
          {
            code: "19 12 03",
            description: "métaux non ferreux",
            children: []
          },
          {
            code: "19 12 04",
            description: "matières plastiques et caoutchouc",
            children: []
          },
          {
            code: "19 12 05",
            description: "verre",
            children: []
          },
          {
            code: "19 12 06*",
            description: "bois contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 12 07",
            description: "bois autres que ceux visés à la rubrique 19 12 06",
            children: []
          },
          {
            code: "19 12 08",
            description: "textiles",
            children: []
          },
          {
            code: "19 12 09",
            description: "minéraux (par exemple sable, cailloux)",
            children: []
          },
          {
            code: "19 12 10",
            description: "déchets combustibles (combustible issu de déchets)",
            children: []
          },
          {
            code: "19 12 11*",
            description:
              "autres déchets (y compris mélanges) provenant du traitement mécanique des déchets contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 12 12",
            description:
              "autres déchets (y compris mélanges) provenant du traitement mécanique des déchets autres que ceux visés à la rubrique 19 12 11",
            children: []
          }
        ]
      },
      {
        code: "19 13",
        description:
          "déchets provenant de la décontamination des sols et des eaux souterraines",
        children: [
          {
            code: "19 13 01*",
            description:
              "déchets solides provenant de la décontamination des sols contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 13 02",
            description:
              "déchets solides provenant de la décontamination des sols autres que ceux visés à la rubrique 19 13 01",
            children: []
          },
          {
            code: "19 13 03*",
            description:
              "boues provenant de la décontamination des sols contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 13 04",
            description:
              "boues provenant de la décontamination des sols autres que celles visées à la rubrique 19 13 03",
            children: []
          },
          {
            code: "19 13 05*",
            description:
              "boues provenant de la décontamination des eaux souterraines contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 13 06",
            description:
              "boues provenant de la décontamination des eaux souterraines autres que celles visées à la rubrique 19 13 05",
            children: []
          },
          {
            code: "19 13 07*",
            description:
              "déchets liquides aqueux et concentrés aqueux provenant de la décontamination des eaux souterraines contenant des substances dangereuses",
            children: []
          },
          {
            code: "19 13 08",
            description:
              "déchets liquides aqueux et concentrés aqueux provenant de la décontamination des eaux souterraines autres que ceux visés à la rubrique 19 13 07",
            children: []
          }
        ]
      }
    ]
  },
  {
    code: "20",
    description:
      "DÉCHETS MUNICIPAUX (DÉCHETS MÉNAGERS ET DÉCHETS ASSIMILÉS PROVENANT DES COMMERCES, DES INDUSTRIES ET DES ADMINISTRATIONS), Y COMPRIS LES FRACTIONS COLLECTÉES SÉPARÉMENT",
    children: [
      {
        code: "20 01",
        description: "fractions collectées séparément (sauf section 15 01)",
        children: [
          {
            code: "20 01 01",
            description: "papier et carton",
            children: []
          },
          {
            code: "20 01 02",
            description: "verre",
            children: []
          },
          {
            code: "20 01 08",
            description: "déchets de cuisine et de cantine biodégradables",
            children: []
          },
          {
            code: "20 01 10",
            description: "vêtements",
            children: []
          },
          {
            code: "20 01 11",
            description: "textiles",
            children: []
          },
          {
            code: "20 01 13*",
            description: "solvants",
            children: []
          },
          {
            code: "20 01 14*",
            description: "acides",
            children: []
          },
          {
            code: "20 01 15*",
            description: "déchets basiques",
            children: []
          },
          {
            code: "20 01 17*",
            description: "produits chimiques de la photographie",
            children: []
          },
          {
            code: "20 01 19*",
            description: "pesticides",
            children: []
          },
          {
            code: "20 01 21*",
            description:
              "tubes fluorescents et autres déchets contenant du mercure",
            children: []
          },
          {
            code: "20 01 23*",
            description:
              "équipements mis au rebut contenant des chlorofluorocarbones",
            children: []
          },
          {
            code: "20 01 25",
            description: "huiles et matières grasses alimentaires",
            children: []
          },
          {
            code: "20 01 26*",
            description:
              "huiles et matières grasses autres que celles visées à la rubrique 20 01 25",
            children: []
          },
          {
            code: "20 01 27*",
            description:
              "peinture, encres, colles et résines contenant des substances dangereuses",
            children: []
          },
          {
            code: "20 01 28",
            description:
              "peinture, encres, colles et résines autres que celles visées à la rubrique 20 01 27",
            children: []
          },
          {
            code: "20 01 29*",
            description: "détergents contenant des substances dangereuses",
            children: []
          },
          {
            code: "20 01 30",
            description:
              "détergents autres que ceux visés à la rubrique 20 01 29",
            children: []
          },
          {
            code: "20 01 31*",
            description: "médicaments cytotoxiques et cytostatiques",
            children: []
          },
          {
            code: "20 01 32",
            description:
              "médicaments autres que ceux visés à la rubrique 20 01 31",
            children: []
          },
          {
            code: "20 01 33*",
            description:
              "piles et accumulateurs visés aux rubriques 16 06 01, 16 06 02 ou 16 06 03 et piles et accumulateurs non triés contenant ces piles",
            children: []
          },
          {
            code: "20 01 34",
            description:
              "piles et accumulateurs autres que ceux visés à la rubrique 20 01 33",
            children: []
          },
          {
            code: "20 01 35*",
            description:
              "équipements électriques et électroniques mis au rebut contenant des composants dangereux, autres que ceux visés aux rubriques 20 01 21 et 20 01 23 (3)",
            children: []
          },
          {
            code: "20 01 36",
            description:
              "équipements électriques et électroniques mis au rebut autres que ceux visés aux rubriques 20 01 21, 20 01 23 et 20 01 35",
            children: []
          },
          {
            code: "20 01 37*",
            description: "bois contenant des substances dangereuses",
            children: []
          },
          {
            code: "20 01 38",
            description: "bois autres que ceux visés à la rubrique 20 01 37",
            children: []
          },
          {
            code: "20 01 39",
            description: "matières plastiques",
            children: []
          },
          {
            code: "20 01 40",
            description: "métaux",
            children: []
          },
          {
            code: "20 01 41",
            description: "déchets provenant du ramonage de cheminée",
            children: []
          },
          {
            code: "20 01 99",
            description: "autres fractions non spécifiées ailleurs",
            children: []
          }
        ]
      },
      {
        code: "20 02",
        description:
          "déchets de jardins et de parcs (y compris les déchets de cimetière)",
        children: [
          {
            code: "20 02 01",
            description: "déchets biodégradables",
            children: []
          },
          {
            code: "20 02 02",
            description: "terres et pierres",
            children: []
          },
          {
            code: "20 02 03",
            description: "autres déchets non biodégradables",
            children: []
          }
        ]
      },
      {
        code: "20 03",
        description: "autres déchets municipaux",
        children: [
          {
            code: "20 03 01",
            description: "déchets municipaux en mélange",
            children: []
          },
          {
            code: "20 03 02",
            description: "déchets de marchés",
            children: []
          },
          {
            code: "20 03 03",
            description: "déchets de nettoyage des rues",
            children: []
          },
          {
            code: "20 03 04",
            description: "boues de fosses septiques",
            children: []
          },
          {
            code: "20 03 06",
            description: "déchets provenant du nettoyage des égouts",
            children: []
          },
          {
            code: "20 03 07",
            description: "déchets encombrants",
            children: []
          },
          {
            code: "20 03 99",
            description: "déchets municipaux non spécifiés ailleurs",
            children: []
          }
        ]
      }
    ]
  }
];

const bsffOnlyWasteCodes = ["14 06 01*"];
const bsdaOnlyWasteCodes = [
  "06 07 01*",
  "06 13 04*",
  "10 13 09*",
  "16 01 11*",
  "16 02 12*",
  "17 06 01*",
  "17 06 05*"
] as const;
const bsdasriOnlyWasteCodes = ["18 01 03*", "18 02 02*"];

export const BSDA_WASTE_CODES = [
  ...bsdaOnlyWasteCodes,
  "08 01 17*",
  "08 04 09*",
  "12 01 16*",
  "15 01 11*",
  "15 02 02*",
  "16 02 13*",
  "16 03 03*",
  "16 03 05*",
  "17 01 06*",
  "17 02 04*",
  "17 03 01*",
  "17 04 09*",
  "17 04 10*",
  "17 05 03*",
  "17 05 05*",
  "17 05 07*",
  "17 06 03*",
  "17 08 01*",
  "17 09 03*"
] as const;

export const BSFF_WASTE_CODES = [
  ...bsffOnlyWasteCodes,
  "14 06 02*",
  "14 06 03*",
  "16 05 04*",
  "13 03 10*"
];

export const BSPAOH_WASTE_CODES = ["18 01 02"] as const; // let's use an array, because some day we'll have to fill it…
export const BSPAOH_WASTE_TYPES = ["PAOH", "FOETUS"] as const;

export const BSDD_WASTES_TREE = toWasteTree(ALL_WASTES_TREE, {
  exclude: [
    ...bsffOnlyWasteCodes,
    ...bsdaOnlyWasteCodes,
    ...bsdasriOnlyWasteCodes
  ]
});

export const ALL_WASTES = flatten(ALL_WASTES_TREE);

export const BSDD_WASTES = flatten(BSDD_WASTES_TREE);
export const BSDD_WASTE_CODES = BSDD_WASTES.map(waste => waste.code);

export const BSDA_WASTES = ALL_WASTES.filter(w =>
  BSDA_WASTE_CODES.some(code => code === w.code)
);

export const BSFF_WASTES = ALL_WASTES.filter(w =>
  BSFF_WASTE_CODES.includes(w.code)
);

export const BSDD_APPENDIX1_WASTE_CODES = [
  ...BSDD_WASTES.filter(waste => {
    const prefixes = ["13 02", "13 05", "16 02", "16 07", "20 01"];
    return prefixes.some(prefix => waste.code.startsWith(prefix));
  }).map(waste => waste.code),
  "15 01 10*",
  "15 02 02*",
  "16 06 01*",
  "19 08 10*"
];
export const BSDD_APPENDIX1_WASTE_TREE = toWasteTree(ALL_WASTES_TREE, {
  include: BSDD_APPENDIX1_WASTE_CODES
});

function flatten(wastes: WasteNode[]): WasteNode[] {
  return wastes
    .reduce(
      (acc: WasteNode[], waste) =>
        acc.concat([waste, ...flatten(waste.children)]),
      []
    )
    .filter(
      // only keep actual wastes and filter out categories
      waste => waste.code.length >= 8
    );
}

export function toWasteTree(
  wasteNodes: WasteNode[],
  opts?: { exclude?: string[] } | { include?: string[] }
): WasteNode[] {
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
    .map(({ code, description, children }) => {
      return {
        code,
        description,
        children: toWasteTree(children, opts)
      };
    });
}

export function isDangerous(wasteCode?: string | null): boolean {
  if (!wasteCode) {
    return false;
  }

  return wasteCode.endsWith("*");
}
