import prisma from "../../prisma";
import {
  BsdasriStatus,
  QuantityType,
  WasteAcceptationStatus,
  Prisma
} from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";

const dasriData = () => ({
  status: "INITIAL" as BsdasriStatus,
  id: getReadableId(ReadableIdPrefix.DASRI),
  isDeleted: false
});

export const bsdasriFactory = async ({
  ownerId,
  opt = {}
}: {
  ownerId: string;
  opt?: Partial<Prisma.BsdasriCreateInput>;
}) => {
  const dasriParams = { ...dasriData(), ...opt };
  return prisma.bsdasri.create({
    data: {
      ...dasriParams,
      owner: { connect: { id: ownerId } }
    }
  });
};

export const initialData = company => ({
  emitterCompanySiret: company.siret,
  emitterCompanyName: company.name,
  emitterCompanyContact: "Contact",
  emitterCompanyPhone: "0123456789",
  emitterCompanyAddress: "Rue jean Jaurès",
  emitterCompanyMail: "emitter@test.fr",
  wasteDetailsCode: "18 01 03*",
  wasteDetailsOnuCode: "abc",
  emitterWasteQuantity: 22,
  emitterWasteQuantityType: QuantityType.ESTIMATED,
  emitterWasteVolume: 66,
  emitterWastePackagingsInfo: [
    { type: "BOITE_CARTON", volume: 22, quantity: 3 }
  ]
});

export const readyToTakeOverData = company => ({
  transporterCompanyName: company.name,
  transporterCompanySiret: company.siret,
  transporterCompanyAddress: "Boulevard machin",
  transporterCompanyPhone: "987654534",
  transporterCompanyContact: "Contact",
  transporterCompanyMail: "transporter@test.fr",
  transporterReceipt: "xyz",
  transporterReceiptDepartment: "83",
  transporterReceiptValidityLimit: new Date(),

  transporterWastePackagingsInfo: [
    { type: "BOITE_CARTON", volume: 22, quantity: 3 }
  ],
  transporterWasteQuantity: 33,
  transporterWasteQuantityType: QuantityType.ESTIMATED,
  transporterWasteVolume: 66,
  transporterWasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
  transporterTakenOverAt: new Date()
});

export const readyToReceiveData = company => ({
  recipientCompanyName: company.name,
  recipientCompanySiret: company.siret,

  recipientCompanyAddress: "rue Legrand",
  recipientCompanyContact: " Contact",
  recipientCompanyPhone: "1234567",
  recipientCompanyMail: "recipient@test.fr",
  recipientWastePackagingsInfo: [
    { type: "BOITE_CARTON", volume: 22, quantity: 3 }
  ],
  recipientWasteVolume: 66,
  recipientWasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
  recipientWasteQuantity: 70,
  receivedAt: new Date()
});
export const readyToProcessData = {
  processingOperation: "D10",
  processedAt: new Date()
};
