import { BsdaConsistence, BsdaType, Prisma } from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { prisma } from "@td/prisma";
import { siretify, upsertBaseSiret } from "../../__tests__/factories";

export const bsdaFactory = async ({
  opt = {},
  transporterOpt = {}
}: {
  opt?: Partial<Prisma.BsdaCreateInput>;
  transporterOpt?: Partial<Prisma.BsdaTransporterCreateInput>;
}) => {
  const bsdaObject = getBsdaObject();

  const data: Prisma.BsdaCreateInput = {
    ...bsdaObject,
    ...opt,
    transporters: {
      create: { ...bsdaObject.transporters!.create!, ...transporterOpt }
    }
  };

  await upsertBaseSiret(
    (data.transporters!.create! as Prisma.BsdaTransporterCreateWithoutBsdaInput) // Prisma.BsdaTransporterCreateWithoutBsdaInput[] is wrongly infered
      .transporterCompanySiret
  );
  await upsertBaseSiret(data.destinationCompanySiret);
  await upsertBaseSiret(data.workerCompanySiret);

  const created = await prisma.bsda.create({
    data: data,
    include: {
      intermediaries: true,
      grouping: true,
      forwarding: true,
      transporters: true
    }
  });
  if (created?.intermediaries) {
    return prisma.bsda.update({
      where: { id: created.id },
      data: {
        intermediariesOrgIds: created.intermediaries
          .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
          .filter(Boolean)
      },
      include: {
        intermediaries: true,
        grouping: true,
        forwarding: true,
        transporters: true
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
  workerCompanyMail: "travaux@td.io",

  transporters: {
    create: {
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
      number: 1
    }
  }
});
