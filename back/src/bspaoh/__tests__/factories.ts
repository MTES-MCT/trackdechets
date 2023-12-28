import prisma from "../../prisma";
import { BspaohStatus, Prisma } from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { siretify, upsertBaseSiret } from "../../__tests__/factories";

const getBspaohTransporter = (
  transporterCompanySiret
): Omit<Prisma.BspaohTransporterCreateInput, "number"> => ({
  transporterCompanyName: "PAOH TRANSPORTER",
  transporterCompanySiret,
  transporterCompanyAddress: "16 rue Jean Jaurès 92400 Courbevoie",
  transporterCompanyContact: "transporter",
  transporterCompanyPhone: "06 18 76 02 66",
  transporterCompanyMail: "transporter@td.io",
  transporterRecepisseNumber: "a receipt",
  transporterRecepisseDepartment: "83",
  transporterRecepisseValidityLimit: "2019-11-27T00:00:00.000Z",
  transporterTransportMode: "ROAD",
  transporterTransportPlates: ["abcd-76-ef"]
});

const getBspaohObject = (
  emitterCompanySiret,
  destinationCompanySiret,
  transporterCompanySiret
): Prisma.BspaohCreateInput => ({
  id: getReadableId(ReadableIdPrefix.PAOH),
  status: "INITIAL" as BspaohStatus,
  isDeleted: false,
  emitterCompanySiret,
  emitterCompanyName: "emitter company",
  emitterCompanyContact: "Contact",
  emitterCompanyPhone: "0123456789",
  emitterCompanyAddress: "Rue jean Jaurès 92200 Neuilly",
  emitterCompanyMail: "emitter@test.fr",
  emitterWasteWeightValue: 10,
  emitterWasteWeightIsEstimate: true,
  emitterWasteQuantityValue: 2,
  wasteType: "PAOH",
  wasteCode: "18 01 02",
  wasteAdr: "abc",
  wastePackagings: [
    {
      id: "packaging_1",
      type: "LITTLE_BOX",
      volume: 10,
      containerNumber: "abcd123",
      quantity: 1,
      consistence: "SOLIDE",
      identificationCodes: ["xyz", "efg"]
    },
    {
      id: "packaging_2",
      type: "LITTLE_BOX",
      volume: 29,
      containerNumber: "abcd123",
      quantity: 1,
      consistence: "SOLIDE",
      identificationCodes: ["ggg", "dfh"]
    }
  ],

  destinationCompanyName: "waste receiver",
  destinationCompanySiret,
  destinationCompanyAddress: "rue Legrand",
  destinationCompanyContact: " Contact",
  destinationCompanyPhone: "1234567",
  destinationCompanyMail: "recipient@test.fr",
  destinationOperationCode: "R 1",
  destinationCap: "cap xyz",
  transporters: {
    create: { ...getBspaohTransporter(transporterCompanySiret), number: 1 }
  }
});
export const bspaohFactory = async ({
  opt = {}
}: {
  opt?: Partial<Prisma.BspaohCreateInput | Prisma.BspaohUncheckedCreateInput>;
}) => {
  const emitterCompanySiret = siretify(1);
  const destinationCompanySiret = siretify(2);
  const transporterCompanySiret = siretify(3);

  await upsertBaseSiret(emitterCompanySiret);
  await upsertBaseSiret(destinationCompanySiret);
  await upsertBaseSiret(transporterCompanySiret);
  const bspaohObject = getBspaohObject(
    emitterCompanySiret,
    destinationCompanySiret,
    transporterCompanySiret
  );
  const paohParams = {
    ...bspaohObject,
    ...opt,
    transporters: {
      create: {
        ...bspaohObject.transporters!.create,
        ...opt.transporters?.create,
        number: 1
      }
    }
  };
  const created = await prisma.bspaoh.create({
    data: {
      ...paohParams
    },
    include: { transporters: true }
  });

  const transportersSirets = [
    ...(created?.transporters ?? []).flatMap(t => [
      t.transporterCompanySiret,
      t.transporterCompanyVatNumber
    ])
  ].filter(Boolean);

  return prisma.bspaoh.update({
    where: { id: created.id },
    data: {
      transportersSirets
    },
    include: { transporters: true }
  });
};
