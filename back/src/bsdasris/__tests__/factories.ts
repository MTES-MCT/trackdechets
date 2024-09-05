import { prisma } from "@td/prisma";
import {
  BsdasriStatus,
  WasteAcceptationStatus,
  Prisma,
  BsdasriType,
  OperationMode,
  TransportMode
} from "@prisma/client";
import { BsdasriPackagingsInput } from "../../generated/graphql/types";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { distinct } from "../../common/arrays";
import { computeTotalVolume } from "../converter";
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
  const dasriParams = {
    ...dasriData(),
    ...opt,
    ...(opt.destinationWastePackagings
      ? {
          destinationReceptionWasteVolume: computeTotalVolume(
            opt.destinationWastePackagings as BsdasriPackagingsInput[]
          )
        }
      : {})
  };

  const created = await prisma.bsdasri.create({
    data: {
      ...dasriParams
    },
    include: { synthesizing: true, grouping: true }
  });

  if (created.type === BsdasriType.SYNTHESIS) {
    const synthesisEmitterSirets = distinct(
      created.synthesizing.map(associated => associated.emitterCompanySiret)
    ).filter(Boolean);

    return prisma.bsdasri.update({
      where: { id: created.id },
      data: { synthesisEmitterSirets }
    });
  }
  if (created.type === BsdasriType.GROUPING) {
    const groupingEmitterSirets = distinct(
      created.grouping.map(grouped => grouped.emitterCompanySiret)
    ).filter(Boolean);

    return prisma.bsdasri.update({
      where: { id: created.id },
      data: { groupingEmitterSirets }
    });
  }

  return created;
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

export const readyToPublishData = destination => ({
  destinationCompanyName: destination.name,
  destinationCompanySiret: destination.siret,
  destinationCompanyAddress: "rue Legrand",
  destinationCompanyContact: " Contact",
  destinationCompanyPhone: "1234567",
  destinationCompanyMail: "recipient@test.fr"
});

export const readyToTakeOverData = company => ({
  transporterCompanyName: company.name,
  transporterCompanySiret: company.siret,
  transporterCompanyVatNumber: company.vatNumber,
  transporterCompanyAddress: "Boulevard machin",
  transporterCompanyPhone: "987654534",
  transporterCompanyContact: "Contact",
  transporterCompanyMail: "transporter@test.fr",
  // ignored and deprecated fields
  transporterRecepisseNumber: "xyz",
  transporterRecepisseDepartment: "83",
  transporterRecepisseValidityLimit: new Date(),
  transporterTransportPlates: ["TRANSPORTER-PLATE"],
  transporterTransportMode: TransportMode.ROAD,
  transporterWastePackagings: [
    { type: "BOITE_CARTON", volume: 22, quantity: 3 }
  ],
  transporterWasteWeightValue: 33,
  transporterWasteWeightIsEstimate: true,
  transporterWasteVolume: 66,
  transporterAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
  transporterTakenOverAt: new Date()
});

export const readyToReceiveData = () => ({
  destinationWastePackagings: [
    { type: "BOITE_CARTON", volume: 22, quantity: 3 }
  ],
  destinationReceptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
  destinationReceptionDate: new Date()
});

export const readyToProcessData = {
  destinationOperationCode: "D10",
  destinationOperationMode: OperationMode.ELIMINATION,
  destinationReceptionWasteWeightValue: 70,
  destinationOperationDate: new Date()
};
