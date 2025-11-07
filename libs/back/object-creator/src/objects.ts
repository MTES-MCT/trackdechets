import { PrismaClient, Prisma } from "@td/prisma";

type DataType<M extends keyof PrismaClient> = Prisma.Args<
  PrismaClient[M],
  "create"
>["data"];

type CreationObject<M extends keyof PrismaClient> = {
  type: M;
  object: DataType<M>;
};
const objects = [
  {
    // prisma "path" (used like this : prisma[newObj.type].create)
    type: "ecoOrganisme",
    object: {
      siret: "45368997800030",
      name: "AKSOR",
      address:
        "ACRELEC GROUP, ZAC DE L'ESPLANADE 3 RUE LOUIS DE BROGLIE 77400 SAINT-THIBAULT-DES-VIGNES",
      handleBsdd: true,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: false
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "81761178300033",
      name: "PYREO",
      address: "22 RUE DE MADRID, 75008 PARIS 8",
      handleBsdd: true,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: false
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "89201535500019",
      name: "ALCOME",
      address: "88 AV DES TERNES, 75017 PARIS",
      handleBsdd: true,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: false
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "90272217200035",
      name: "VALOBAT",
      address: "77 ESP DU GENERAL DE GAULLE 92800 PUTEAUX",
      handleBsdd: true,
      handleBsdasri: false,
      handleBsda: true,
      handleBsvhu: false
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "90377711800022",
      name: "CYCLEVIA",
      address:
        "IMMEUBLE CONCORDE, 4 RUE JACQUES DAGUERRE, 92500 RUEIL-MALMAISON",
      handleBsdd: true,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: false
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "91187025100012",
      name: "ECOMINERO",
      address: "16 B BD JEAN JAURES 92110 CLICHY",
      handleBsdd: true,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: false
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "95450607700120",
      name: "RENAULT TRUCKS",
      address: "99 ROUTE DE LYON, 69800 SAINT-PRIEST",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "52433526200431",
      name: "TESLA FRANCE",
      address: "150 BOULEVARD VICTOR HUGO, 93400 SAINT-OUEN-SUR-SEINE",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "33006637400043",
      name: "SUZUKI FRANCE",
      address: "ZA TRAPPES, 8 AVENUE DES FRERES LUMIERE, 78190 TRAPPES",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "41968381800027",
      name: "IVECO FRANCE",
      address: "PORTE E, 1 RUE DES COMBATS DU 24 AOUT 44, 69200 VENISSIEUX",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "71203404000154",
      name: "TOYOTA FRANCE",
      address: "N°20 A 30, 20 BOULEVARD DE LA REPUBLIQUE, 92420 VAUCRESSON",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "88857389600022",
      name: "SAIC MOTOR FRANCE",
      address: "25 QUAI DU PRESIDENT PAUL DOUMER, 92400 COURBEVOIE",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "78012998704037",
      name: "RENAULT SAS",
      address:
        "122-122, 122 B AVENUE DU GENERAL LECLERC, 92100 BOULOGNE-BILLANCOURT",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "69980917400179",
      name: "NISSAN WEST EUROPE",
      address: "8 RUE JEAN-PIERRE TIMBAUD, 78180 MONTIGNY-LE-BRETONNEUX",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "50901680400049",
      name: "JAGUAR LAND ROVER FRANCE",
      address: "TOUR DEFENSE, 23 RUE DELARIVIERE LEFOULLON, 92800 PUTEAUX",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "54206547900926",
      name: "STELLANTIS AUTO SAS",
      address: "2-10, 2 BOULEVARD DE L’EUROPE, 78300 POISSY",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "83227737000017",
      name: "VOLKSWAGEN GROUP FRANCE",
      address: "11 AVENUE DE BOURSONNE, 02600 VILLERS-COTTERETS",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "50924356400010",
      name: "HONDA MOTOR EUROPE LTD - SUCCURSALE FRANCE",
      address: "CAIN ROAD BRACKNELL BERKHIRE,  ENGLAND RG 12 1HL ROYAUME-UNI",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,

  {
    type: "ecoOrganisme",
    object: {
      siret: "42512736200043",
      name: "FMC AUTOMOBILES",
      address: "IMMEUBLE AXE SEINE, 1 RUE DU 1ER MAI, 92000 NANTERRE",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "43445596000022",
      name: "MAZDA AUTOMOBILES FRANCE",
      address: "34 RUE DE LA CROIX DE FER, 78100 SAINT-GERMAIN-EN-LAYE",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "41139489300043",
      name: "HYUNDAI MOTOR FRANCE",
      address: "TOUR NOVA, 71 BOULEVARD NATIONAL, 92250 LA GARENNE-COLOMBES",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "32836885700020",
      name: "AIXAM MEGA",
      address: "56 ROUTE DE PUGNY 73100 AIX-LES-BAINS",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "39391874300062",
      name: "HARLEY-DAVIDSON FRANCE",
      address: "EUROPARC 12 RUE EUGENE DUPUIS 94000 CRETEIL",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "38391529500083",
      name: "KIA FRANCE",
      address: "2 RUE DES MARTINETS 92500 RUEIL-MALMAISON",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "44451198400031",
      name: "MIDI FRANCE",
      address: "6 RUE JEAN-PIERRE TIMBAUD 78180 MONTIGNY-LE-BRETONNEUX",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">,
  {
    type: "ecoOrganisme",
    object: {
      siret: "31022749100159",
      name: "PIAGGIO FRANCE",
      address: "21 RUE GEORGES BOISSEAU 92110 CLICHY",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  } as CreationObject<"ecoOrganisme">
];

export default objects;
