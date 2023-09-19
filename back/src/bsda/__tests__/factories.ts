import { BsdaConsistence, BsdaType, Prisma } from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import prisma from "../../prisma";
import { siretify, upsertBaseSiret } from "../../__tests__/factories";

export const bsdaFactory = async ({
  opt = {}
}: {
  opt?: Partial<Prisma.BsdaCreateInput>;
}) => {
  const bsdaObject = getBsdaObject();

  await upsertBaseSiret(bsdaObject.transporterCompanySiret);
  await upsertBaseSiret(bsdaObject.destinationCompanySiret);
  await upsertBaseSiret(bsdaObject.workerCompanySiret);

  const formParams = { ...bsdaObject, ...opt };
  const created = await prisma.bsda.create({
    data: {
      ...formParams
    },
    include: { intermediaries: true }
  });
  if (created?.intermediaries) {
    return prisma.bsda.update({
      where: { id: created.id },
      data: {
        intermediariesOrgIds: created.intermediaries
          .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
          .filter(Boolean)
      }
    });
  }

  return created;
};

const getBsdaObject = (): Prisma.BsdaCreateInput => ({
  id: getReadableId(ReadableIdPrefix.BSDA),

  type: BsdaType.OTHER_COLLECTIONS,
  emitterCompanyName: "emitter company",
  emitterCompanySiret: siretify(1),
  emitterCompanyAddress: "20 Avenue de l'Emitter, Emitter City",
  emitterCompanyContact: "Marc Martin",
  emitterCompanyPhone: "06 18 76 02 66",
  emitterCompanyMail: "recipient@td.io",
  emitterIsPrivateIndividual: false,

  wasteCode: "06 07 01*",
  wasteFamilyCode: "6",
  wasteMaterialName:
    "Amiante lié : Amiante ciment, lié à des matériaux inertes",
  wasteConsistence: BsdaConsistence.SOLIDE,
  wasteSealNumbers: ["1", "2", "3"],
  wasteAdr: "Mention ADR",
  wastePop: false,

  packagings: [
    { type: "PALETTE_FILME", quantity: 1 },
    { type: "BIG_BAG", quantity: 2 }
  ],
  weightIsEstimate: false,
  weightValue: 25.4,

  destinationPlannedOperationCode: "D 5",
  destinationCompanyName: "I reveive waste INC",
  destinationCompanySiret: siretify(2),
  destinationCompanyAddress: "14 boulevard Recipient, Recipient City",
  destinationCompanyContact: "André Recipient",
  destinationCompanyPhone: "05 05 05 05 05",
  destinationCompanyMail: "recipient@td.io",
  destinationCap: "CAP",

  transporterCompanyName: "Transport facile",
  transporterCompanySiret: siretify(3),
  transporterCompanyAddress: "12 route du Transporter, Transporter City",
  transporterCompanyContact: "Henri Transport",
  transporterCompanyPhone: "06 06 06 06 06",
  transporterCompanyMail: "transporter@td.io",
  transporterRecepisseNumber: "a receipt",
  transporterRecepisseDepartment: "83",
  transporterRecepisseValidityLimit: "2019-11-27T00:00:00.000Z",
  transporterTransportMode: "ROAD",
  transporterTransportPlates: ["AA-00-XX"],

  destinationReceptionDate: "2019-11-27T00:00:00.000Z",
  destinationReceptionWeight: 1.2,
  destinationReceptionAcceptationStatus: "ACCEPTED",
  destinationReceptionRefusalReason: null,
  destinationOperationCode: "D 9",
  destinationOperationMode: "ELIMINATION",
  destinationOperationDate: "2019-11-28T00:00:00.000Z",

  workerIsDisabled: false,
  workerCompanyName: "Entreprise de travaux",
  workerCompanySiret: siretify(4),
  workerCompanyAddress: "1 route du travail, Travaux city",
  workerCompanyContact: "Jack Travaux",
  workerCompanyPhone: "05 05 05 05 05",
  workerCompanyMail: "travaux@td.io"
});
