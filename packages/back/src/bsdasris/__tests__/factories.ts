import prisma from "../../prisma";
import { BsdasriStatus, WasteAcceptationStatus, Prisma } from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";

const dasriData = () => ({
  status: "INITIAL" as BsdasriStatus,
  id: getReadableId(ReadableIdPrefix.DASRI),
  isDeleted: false
});

export const bsdasriFactory = async ({
  opt = {}
}: {
  opt?: Partial<Prisma.BsdasriCreateInput>;
}) => {
  const dasriParams = { ...dasriData(), ...opt };
  return prisma.bsdasri.create({
    data: {
      ...dasriParams
    }
  });
};

export const initialData = company => ({
  emitterCompanySiret: company.siret,
  emitterCompanyName: company.name,
  emitterCompanyContact: "Contact",
  emitterCompanyPhone: "0123456789",
  emitterCompanyAddress: "Rue jean Jaurès 92200 Neuilly",
  emitterCompanyMail: "emitter@test.fr",
  wasteCode: "18 01 03*",
  wasteAdr: "abc",
  emitterWasteWeightValue: 22,
  emitterWasteWeightIsEstimate: true,
  emitterWasteVolume: 66,
  emitterWastePackagings: [{ type: "BOITE_CARTON", volume: 22, quantity: 3 }]
});

export const readyToTakeOverData = company => ({
  transporterCompanyName: company.name,
  transporterCompanySiret: company.siret,
  transporterCompanyAddress: "Boulevard machin",
  transporterCompanyPhone: "987654534",
  transporterCompanyContact: "Contact",
  transporterCompanyMail: "transporter@test.fr",
  transporterRecepisseNumber: "xyz",
  transporterRecepisseDepartment: "83",
  transporterRecepisseValidityLimit: new Date(),

  transporterWastePackagings: [
    { type: "BOITE_CARTON", volume: 22, quantity: 3 }
  ],
  transporterWasteWeightValue: 33,
  transporterWasteWeightIsEstimate: true,
  transporterWasteVolume: 66,
  transporterAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
  transporterTakenOverAt: new Date()
});

export const readyToReceiveData = company => ({
  destinationCompanyName: company.name,
  destinationCompanySiret: company.siret,

  destinationCompanyAddress: "rue Legrand",
  destinationCompanyContact: " Contact",
  destinationCompanyPhone: "1234567",
  destinationCompanyMail: "recipient@test.fr",
  destinationWastePackagings: [
    { type: "BOITE_CARTON", volume: 22, quantity: 3 }
  ],
  destinationReceptionWasteVolume: 66,
  destinationReceptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
  destinationReceptionDate: new Date()
});
export const readyToProcessData = {
  destinationOperationCode: "D10",
  destinationReceptionWasteWeightValue: 70,
  destinationOperationDate: new Date()
};
