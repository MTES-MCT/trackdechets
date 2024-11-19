import { BsdaConsistence, BsdaType, Prisma } from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { prisma } from "@td/prisma";
import {
  siretify,
  upsertBaseSiret,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { getCanAccessDraftOrgIds } from "../utils";

/**
 * Permet de créer un BSDA avec des données par défaut et
 * un premier transporteur. Les données du BSDA et du premier
 * transporteur peuvent être modifiées grâce aux paramètres
 * `opt` et `transporterOpt`.
 *
 * Pour créer un BSDA avec des transporteurs multi-modaux, on
 * commence par créer un BSDA avec un premier transporteur
 * grâce à `bsdaFactory` puis on ajoute les transporteur suivants
 * grâce à `bsdaTransporterFactory`
 */
export const bsdaFactory = async ({
  userId,
  opt = {},
  transporterOpt = {}
}: {
  userId?: string;
  opt?: Partial<Prisma.BsdaCreateInput>;
  transporterOpt?: Partial<Prisma.BsdaTransporterCreateInput>;
}) => {
  const bsdaObject = getBsdaObject();
  const userAndCompany = userId
    ? null
    : await userWithCompanyFactory("ADMIN", {
        siret: bsdaObject.emitterCompanySiret,
        name: bsdaObject.emitterCompanyName ?? undefined,
        address: bsdaObject.emitterCompanyAddress ?? undefined,
        contact: bsdaObject.emitterCompanyContact ?? undefined,
        contactPhone: bsdaObject.emitterCompanyPhone ?? undefined,
        contactEmail: bsdaObject.emitterCompanyMail ?? undefined
      });
  await upsertBaseSiret({
    siret: (
      bsdaObject.transporters!
        .create! as Prisma.BsdaTransporterCreateWithoutBsdaInput
    ).transporterCompanySiret! // Prisma.BsdaTransporterCreateWithoutBsdaInput[] is wrongly infered
  });
  await upsertBaseSiret({ siret: bsdaObject.destinationCompanySiret! });
  await upsertBaseSiret({ siret: bsdaObject.workerCompanySiret! });

  const data: Prisma.BsdaCreateInput = {
    ...bsdaObject,
    transporters: {
      ...(opt.transporters?.createMany
        ? { createMany: opt.transporters?.createMany }
        : {
            create: { ...bsdaObject.transporters!.create!, ...transporterOpt }
          })
    },
    ...opt
  };

  const created = await prisma.bsda.create({
    data: data,
    include: {
      intermediaries: true,
      grouping: true,
      forwarding: true,
      transporters: true
    }
  });
  const intermediariesOrgIds: string[] = created.intermediaries
    ? created.intermediaries
        .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
        .filter(Boolean)
    : [];
  const transportersOrgIds: string[] = created.transporters
    ? created.transporters
        .flatMap(t => [
          t.transporterCompanySiret,
          t.transporterCompanyVatNumber
        ])
        .filter(Boolean)
    : [];
  // For drafts, only the owner's sirets that appear on the bsd have access
  const canAccessDraftOrgIds = await getCanAccessDraftOrgIds(
    created,
    (userId || userAndCompany?.user?.id) as string
  );

  return prisma.bsda.update({
    where: { id: created.id },
    data: {
      ...(canAccessDraftOrgIds.length ? { canAccessDraftOrgIds } : {}),
      ...(transportersOrgIds.length ? { transportersOrgIds } : {}),
      ...(intermediariesOrgIds.length ? { intermediariesOrgIds } : {})
    },
    include: {
      intermediaries: true,
      grouping: true,
      forwarding: true,
      transporters: true
    }
  });
};

export const bsdaTransporterFactory = async ({
  bsdaId,
  opts
}: {
  bsdaId: string;
  opts: Omit<Prisma.BsdaTransporterCreateWithoutBsdaInput, "number">;
}) => {
  const count = await prisma.bsdaTransporter.count({ where: { bsdaId } });
  return prisma.bsdaTransporter.create({
    data: {
      bsda: { connect: { id: bsdaId } },
      ...bsdaTransporterData,
      number: count + 1,
      ...opts
    }
  });
};

export const bsdaFinalOperationFactory = async ({
  bsdaId,
  opts = {}
}: {
  bsdaId: string;
  opts?: Omit<
    Partial<Prisma.BsdaFinalOperationCreateInput>,
    "initialBsda" | "finalBsda"
  >;
}) => {
  return prisma.bsdaFinalOperation.create({
    data: {
      initialBsda: { connect: { id: bsdaId } },
      finalBsda: { connect: { id: bsdaId } },
      operationCode: "",
      quantity: 1,
      ...opts
    }
  });
};

const bsdaTransporterData: Omit<
  Prisma.BsdaTransporterCreateWithoutBsdaInput,
  "number"
> = {
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
  transporterRecepisseIsExempted: false
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
  destinationOperationCode: "D 5",
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
    create: { ...bsdaTransporterData, number: 1 }
  }
});
