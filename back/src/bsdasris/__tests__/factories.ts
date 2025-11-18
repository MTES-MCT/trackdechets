import { prisma } from "@td/prisma";
import {
  BsdasriStatus,
  WasteAcceptationStatus,
  Prisma,
  BsdasriType,
  OperationMode,
  TransportMode,
  Company
} from "@td/prisma";
import type { BsdasriPackagingsInput } from "@td/codegen-back";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { distinct } from "../../common/arrays";
import { computeTotalVolume } from "../converter";
import { getCanAccessDraftOrgIds } from "../utils";
import { ZodBsdasriPackagingEnum } from "../validation/schema";

const dasriData = () => ({
  status: "INITIAL" as BsdasriStatus,
  id: getReadableId(ReadableIdPrefix.DASRI),
  isDeleted: false
});

export const bsdasriFactory = async ({
  userId,
  opt = {}
}: {
  userId?: string;
  opt?: Partial<Prisma.BsdasriCreateInput>;
}) => {
  const bsdasriInclude = {
    synthesizing: true,
    grouping: true,
    intermediaries: true
  };
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
    include: bsdasriInclude
  });
  const intermediariesOrgIds: string[] = created.intermediaries
    ? created.intermediaries
        .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
        .filter(Boolean)
    : [];

  if (created.type === BsdasriType.SYNTHESIS) {
    const synthesisEmitterSirets = distinct(
      created.synthesizing.map(associated => associated.emitterCompanySiret)
    ).filter(Boolean);

    await prisma.bsdasri.update({
      where: { id: created.id },
      data: { synthesisEmitterSirets }
    });
  }

  if (created.type === BsdasriType.GROUPING) {
    const groupingEmitterSirets = distinct(
      created.grouping.map(grouped => grouped.emitterCompanySiret)
    ).filter(Boolean);

    await prisma.bsdasri.update({
      where: { id: created.id },
      data: { groupingEmitterSirets }
    });
  }

  const canAccessDraftOrgIds =
    created.isDraft && userId
      ? await getCanAccessDraftOrgIds(created, userId)
      : [];

  return prisma.bsdasri.update({
    where: { id: created.id },
    data: {
      ...(canAccessDraftOrgIds.length ? { canAccessDraftOrgIds } : {}),
      ...(intermediariesOrgIds.length ? { intermediariesOrgIds } : {})
    },
    include: bsdasriInclude
  });
};

export const bsdasriFinalOperationFactory = async ({
  bsdasriId,
  opts = {}
}: {
  bsdasriId: string;
  opts?: Omit<
    Partial<Prisma.BsdasriFinalOperationCreateInput>,
    "initialBsdasri" | "finalBsdasri"
  >;
}) => {
  return prisma.bsdasriFinalOperation.create({
    data: {
      initialBsdasri: { connect: { id: bsdasriId } },
      finalBsdasri: { connect: { id: bsdasriId } },
      operationCode: "",
      quantity: 1,
      ...opts
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
  emitterWastePackagings: [
    { type: "BOITE_CARTON" as ZodBsdasriPackagingEnum, volume: 22, quantity: 3 }
  ]
});

export const brokerData = (company: Company) => ({
  brokerCompanySiret: company.siret,
  brokerCompanyName: company.name,
  brokerCompanyContact: company.contact,
  brokerCompanyPhone: company.contactPhone,
  brokerCompanyAddress: company.address,
  brokerCompanyMail: company.contactEmail,
  brokerRecepisseNumber: "recep broker",
  brokerRecepisseDepartment: "13",
  brokerRecepisseValidityLimit: new Date()
});
export const traderData = (company: Company) => ({
  traderCompanySiret: company.siret,
  traderCompanyName: company.name,
  traderCompanyContact: company.contact,
  traderCompanyPhone: company.contactPhone,
  traderCompanyAddress: company.address,
  traderCompanyMail: company.contactEmail,

  traderRecepisseNumber: "recep trader",
  traderRecepisseDepartment: "83",
  traderRecepisseValidityLimit: new Date()
});

export const intermediaryData = (
  company: Company,
  contact = "intermediary"
) => ({
  siret: company.siret!,
  name: company.name,
  address: company.address,
  contact
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
  transporterTransportPlates: ["AB-65-ML"],
  transporterTransportMode: TransportMode.ROAD,
  transporterWastePackagings: [
    { type: "BOITE_CARTON" as ZodBsdasriPackagingEnum, volume: 22, quantity: 3 }
  ],
  transporterWasteWeightValue: 33,
  transporterWasteWeightIsEstimate: true,
  transporterWasteVolume: 66,
  transporterAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
  transporterTakenOverAt: new Date()
});

export const readyToReceiveData = () => ({
  destinationWastePackagings: [
    { type: "BOITE_CARTON" as ZodBsdasriPackagingEnum, volume: 22, quantity: 3 }
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
