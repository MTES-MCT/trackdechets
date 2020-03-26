import { Updater, registerUpdater } from ".";
import { prisma } from "../../src/generated/prisma-client";

@registerUpdater(
  "Insert Eco-organismes",
  `Insert existing eco-organismes in DB if none exist yet`
)
export class InsertEcoOrganismesUpdater implements Updater {
  run() {
    console.info(
      "Starting script to insert eco organismes in DB if there is no data yet..."
    );

    try {
      return prisma
        .ecoOrganismesConnection()
        .aggregate()
        .count()
        .then(async count => {
          if (count !== 0) {
            console.info(
              "Some eco-organsimes already exist in DB, skipping..."
            );
            return;
          }

          console.info("Creating eco-organismes...");
          return Promise.all(organismes.map(o => prisma.createEcoOrganisme(o)));
        });
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}

const organismes = [
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
  }
];
