import { prisma } from "@td/prisma";
import { registerUpdater, Updater } from "./helper/helper";

const ecoOrganismes = [
  {
    name: "Corepile",
    siret: "42248908800035",
    address: "17 rue Georges Bizet, 75016 Paris"
  },
  {
    name: "Screlec",
    siret: "42258207200035",
    address: "52 BOULEVARD DU MONTPARNASSE, 75015 PARIS"
  },
  {
    name: "CITEO",
    siret: "38838007300162",
    address: "CITEO, 50 BD HAUSSMANN 75009 PARIS"
  },
  {
    name: "Adelphe",
    siret: "39091301000042",
    address: "93 RUE DE PROVENCE 75009 PARIS"
  },
  {
    name: "Eco-Mobilier",
    siret: "53849587000031",
    address: "50 AV DAUMESNIL 75012 PARIS"
  },
  {
    name: "PV Cycle",
    siret: "800 547 499 00023",
    address: "13 RUE DU QUATRE SEPTEMBRE 75002 PARIS"
  },
  {
    name: "Valdelia",
    siret: "53740637300036",
    address: "RUE DU LAC 31670 LABEGE"
  },
  {
    name: "Eco-DDS",
    siret: "75113994000025",
    address: "117 AV VICTOR HUGO 92100 BOULOGNE-BILLANCOURT"
  },
  {
    name: "Ecologic",
    siret: "48774196900033",
    address: "15BIS AVENUE DU CENTRE, 78280 GUYANCOURT"
  },
  {
    name: "Eco-TLC",
    siret: "50929280100024",
    address: "4 Cité Paradis - 75010 PARIS - France"
  },
  {
    name: "DASTRI",
    siret: "79250555400024",
    address: "17, rue de l’Amiral Hamelin à Paris (75016)"
  },
  {
    name: "ECOSYSTEM",
    siret: "83033936200022",
    address: "34 RUE HENRI REGNAULT 92400 COURBEVOIE"
  },
  {
    name: "LEKO",
    siret: "82330882000021",
    address: "29 RUE TRONCHET 75008 PARIS"
  },
  {
    name: "CYCLAMED",
    siret: "39316301900044",
    address: "60 T RUE DE BELLEVUE - 92100 BOULOGNE-BILLANCOURT"
  },
  {
    name: "ECOFOLIO",
    siret: "49337909300039",
    address: "3 PL DES VICTOIRES 75001 PARIS"
  },
  {
    name: "RECYLUM",
    siret: "48232394600012",
    address: "17 RUE DE L'AMIRAL HAMELIN 75116 PARIS"
  },
  {
    name: "ERP FRANCE",
    siret: "51436434800045",
    address: "10 RUE DE PENTHIEVRE 75008 PARIS"
  },
  {
    name: "APER",
    siret: "51319280700024",
    address: "PONT MIRABEAU 75015 PARIS"
  },
  {
    name: "APER PYRO",
    siret: "81761178300017",
    address: "PORT DE JAVEL 75015 PARIS"
  },
  {
    name: "A.D.I VALOR",
    siret: "43836840900043",
    address: "68 CRS ALBERT THOMAS 69008 LYON"
  }
];

@registerUpdater(
  "Update Eco-organismes",
  "Update the list of eco-organismes in the database",
  false
)
export class UpdateEcoOrganismesUpdater implements Updater {
  async run() {
    for (const ecoOrganisme of ecoOrganismes) {
      await prisma.ecoOrganisme.upsert({
        create: ecoOrganisme,
        update: ecoOrganisme,
        where: {
          siret: ecoOrganisme.siret
        }
      });
    }
  }
}
