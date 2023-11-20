import { Updater, registerUpdater } from "./helper/helper";
import prisma from "../../src/prisma";

const EMITTER = {
    siret: "90308954800023",
    name: "GAEL FERRAND (émetteur)",
    contact: {
        name: "Gaël Ferrand",
        email: "gael.ferrand@beta.gouv.fr",
        phone: "0601020304"
    }
};

const TRANSPORTER = {
    siret: "80274265000038",
    name: "TEST & MESURES GROUPE (transporteur)",
    contact: {
        name: "Prénom Transp",
        email: "transporteur@xn--dchets-bva.com",
        phone: "0600000000"
    }
};

const DESTINATION = {
    siret: "42861039800102",
    name: "SPHEREA TEST & SERVICES (installation)",
    contact: {
        name: "Prénom Install",
        email: "installation@dechets.com",
        phone: "0600000000"
    }
};

@registerUpdater(
  "Create grouped bsdas",
  "Create grouped bsdas",
  false
)
export class CreateGroupedBsdas implements Updater {
  async run() {
  }
}
