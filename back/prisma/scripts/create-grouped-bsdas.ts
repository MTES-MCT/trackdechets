import prisma from "../../src/prisma";
import { format } from "date-fns";
import { enqueueUpdatedBsdToIndex } from "../../src/queue/producers/elastic";

export function base32Encode(n: number): string {
    const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".split("");
    function encode(n: number, encoded = "") {
      if (n > 0) {
        const r = n % 32;
        const q = (n - r) / 32;
        const symbol = alphabet[r];
        return encode(q, symbol + encoded);
      }
      return encoded;
    }
    if (n === 0) {
      return "0";
    } else {
      return encode(n);
    }
  }

  export function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
  }

const EMITTER = {
    siret: "90308954800023",
    name: "GAEL FERRAND (émetteur)",
    address: "4 BD PASTEUR 44100 NANTES",
    contact: {
        name: "Gaël Ferrand",
        mail: "gael.ferrand@beta.gouv.fr",
        phone: "0601020304"
    }
};

const TRANSPORTER = {
    siret: "80274265000038",
    name: "TEST & MESURES GROUPE (transporteur)",
    address: "109 AV DU GENERAL EISENHOWER 31100 TOULOUSE",
    contact: {
        name: "Prénom Transp",
        mail: "transporteur@xn--dchets-bva.com",
        phone: "0600000000"
    }
};

const DESTINATION = {
    siret: "42861039800102",
    address: "109 AV DU GENERAL EISENHOWER CS 42326 31100 TOULOUSE",
    name: "SPHEREA TEST & SERVICES (installation)",
    contact: {
        name: "Prénom Install",
        mail: "installation@dechets.com",
        phone: "0600000000"
    }
};

export const bsdaFactory = async (index: number) => {
    const bsdaObject = getBsdaObject(index);
  
    const formParams = { ...bsdaObject };
    const created = await prisma.bsda.create({
      data: {
        ...formParams
      },
      include: { intermediaries: true, grouping: true, forwarding: true }
    });
    if (created?.intermediaries) {
      return prisma.bsda.update({
        where: { id: created.id },
        data: {
          intermediariesOrgIds: created.intermediaries
            .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
            .filter(Boolean)
        },
        include: { intermediaries: true, grouping: true, forwarding: true }
      });
    }
  
    return created;
  };

  export default function getReadableId(prefix = "BSD") {
    const now = new Date();
    const todayStr = format(now, "yyyyMMdd");
    const charsLength = 9;
    const max = Math.pow(32, charsLength) - 1; // "ZZZZZZZZZ" in base 32, ~3*10^13
    const randomNumber = getRandomInt(max);
    // convert number to base32 string padded with `0`
    const encoded = base32Encode(randomNumber).padStart(charsLength, "0");
    return `${prefix}-${todayStr}-${encoded}`;
  }


const getBsdaObject = (index: number): any => ({
    id: getReadableId("BSDA"),
    status: "AWAITING_CHILD",
  
    type: "OTHER_COLLECTIONS",
    emitterCompanyName: EMITTER.name,
    emitterCompanySiret: EMITTER.siret,
    emitterCompanyAddress: EMITTER.address,
    emitterCompanyContact: EMITTER.contact.name,
    emitterCompanyPhone:  EMITTER.contact.phone,
    emitterCompanyMail:  EMITTER.contact.mail,
    emitterIsPrivateIndividual: false,
  
    wasteCode: "06 07 01*",
    wasteFamilyCode: "6",
    wasteMaterialName:
      `Amiante du bordereau ${index}`,
    wasteConsistence: "SOLIDE",
    wasteSealNumbers: [`WASTE-${index}-SEAL-NBR-1`, `WASTE-${index}-SEAL-NBR-2`, `WASTE-${index}-SEAL-NBR-3`],
    wasteAdr: "Mention ADR",
    wastePop: false,
  
    packagings: [
      { type: "PALETTE_FILME", quantity: 1 },
      { type: "BIG_BAG", quantity: 2 }
    ],
    weightIsEstimate: false,
    weightValue: 15,
  
    destinationPlannedOperationCode: "D 5",
    destinationCompanyName: DESTINATION.name,
    destinationCompanySiret: DESTINATION.siret,
    destinationCompanyAddress: DESTINATION.address,
    destinationCompanyContact: DESTINATION.contact.name,
    destinationCompanyPhone: DESTINATION.contact.phone,
    destinationCompanyMail: DESTINATION.contact.mail,
    destinationCap: "DESTINATION-CAP",
  
    transporterCompanyName:TRANSPORTER.name,
    transporterCompanySiret: TRANSPORTER.siret,
    transporterCompanyAddress: TRANSPORTER.address,
    transporterCompanyContact: TRANSPORTER.contact.name,
    transporterCompanyPhone: TRANSPORTER.contact.phone,
    transporterCompanyMail: TRANSPORTER.contact.mail,
    transporterRecepisseNumber: "a receipt",
    transporterRecepisseDepartment: "83",
    transporterRecepisseValidityLimit: "2019-11-27T00:00:00.000Z",
    transporterTransportMode: "ROAD",
    transporterTransportPlates: [`TRANSPORTER-PLATES-${index}`],
  
    destinationReceptionDate: "2019-11-27T00:00:00.000Z",
    destinationReceptionWeight: 15,
    destinationReceptionAcceptationStatus: "ACCEPTED",
    destinationReceptionRefusalReason: null,
    destinationOperationCode: "R 13",
    destinationOperationDate: "2019-11-28T00:00:00.000Z",
  
    workerIsDisabled: false,
    workerCompanyName: DESTINATION.name,
    workerCompanySiret: DESTINATION.siret,
    workerCompanyAddress: DESTINATION.address,
    workerCompanyContact: DESTINATION.contact.name,
    workerCompanyPhone: DESTINATION.contact.phone,
    workerCompanyMail: DESTINATION.contact.mail
  });


  const run = async () => {

    console.log('=====================================================')
    console.log('=============== CreateGroupedBsdas ==================')
    console.log('=====================================================')

    for(let i = 1; i<=100; i++){
        const bsda = await bsdaFactory(i);
        await enqueueUpdatedBsdToIndex(bsda.id);
        console.log(`[${i}] bsda: ${bsda.id}`)
    }
  };

  run();


//   @registerUpdater(
//     "Create grouped bsdas",
//     "Create grouped bsdas",
//     true
//   )
//   export class CreateGroupedBsdas implements Updater {
//     async run() {
  
//       console.log('=====================================================')
//       console.log('=============== CreateGroupedBsdas ==================')
//       console.log('=====================================================')
  
//       const bsda = await bsdaFactory({});
  
//       console.log("Created BSDA!")
//       console.log("bsda", bsda)
  
//     }
//   }