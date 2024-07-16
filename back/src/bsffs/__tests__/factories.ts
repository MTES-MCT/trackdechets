import type { SetRequired } from "type-fest";
import {
  Prisma,
  TransportMode,
  BsffStatus,
  BsffType,
  BsffPackaging,
  WasteAcceptationStatus,
  BsffPackagingType,
  OperationMode
} from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { prisma } from "@td/prisma";
import { UserWithCompany } from "../../__tests__/factories";
import { OPERATION } from "../constants";
import { BSFF_WASTE_CODES } from "@td/constants";

interface BsffFactoryCompanies {
  emitter?: UserWithCompany;
  transporter?: UserWithCompany;
  destination?: UserWithCompany;
}

interface BsffFactoryOpts {
  data?: Partial<Prisma.BsffCreateInput>;
  transporterData?: Partial<Prisma.BsffTransporterCreateInput>;
  packagingData?: Partial<Prisma.BsffPackagingCreateInput>;
  previousPackagings?: BsffPackaging[];
}

/**
 * Bsff factory utilisé dans les tests.
 * Elle crée un bordereau à l'état initial avec un contenant et un transporteur.
 * Les données des établissements peuvent être injectés via le premier paramètre
 * et les données du BSFF, du transporteur et du packaging peuvent être modifiés
 * via le second paramètre.
 *
 * Les fonctions suivantes `createBsffBeforeEmission`, `createBsffAfterEmission`, etc
 * se composent de façon récursive à partir de cette première fonction pour créer des
 * BSFFs a différentes étapes du workflow.
 */
export async function createBsff(
  { emitter, transporter, destination }: BsffFactoryCompanies = {},
  {
    data,
    transporterData,
    packagingData,
    previousPackagings
  }: BsffFactoryOpts = {}
) {
  let input: Prisma.BsffCreateInput = {
    id: getReadableId(ReadableIdPrefix.FF),
    type: BsffType.TRACER_FLUIDE,
    status: BsffStatus.INITIAL,
    packagings: {
      create: createBsffPackaging(packagingData ?? {}, previousPackagings)
    },
    transporters: {
      create: {
        ...transporterData,
        number: 1
      }
    },
    ...data
  };

  if (emitter) {
    input = {
      ...input,
      emitterCompanyName: emitter.company.name,
      emitterCompanySiret: emitter.company.siret,
      emitterCompanyAddress: emitter.company.address,
      emitterCompanyContact: emitter.user.name,
      emitterCompanyPhone: emitter.company.contactPhone,
      emitterCompanyMail: emitter.company.contactEmail
    };
  }

  if (transporter) {
    let transporterData: Omit<Prisma.BsffTransporterCreateInput, "number"> = {
      transporterCompanyName: transporter.company.name,
      transporterCompanySiret: transporter.company.siret,
      transporterCompanyAddress: transporter.company.address,
      transporterCompanyContact: transporter.user.name,
      transporterCompanyPhone: transporter.company.contactPhone,
      transporterCompanyMail: transporter.company.contactEmail,
      transporterCompanyVatNumber: transporter.company.vatNumber
    };
    const transporterReceipt = await prisma.company
      .findUnique({
        where: { id: transporter.company.id }
      })
      .transporterReceipt();

    if (transporterReceipt) {
      transporterData = {
        ...transporterData,
        transporterRecepisseIsExempted: false,
        transporterRecepisseNumber: transporterReceipt.receiptNumber,
        transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
        transporterRecepisseDepartment: transporterReceipt.department
      };
    }
    input = {
      ...input,
      transportersOrgIds: [
        transporter.company.siret,
        transporter.company.vatNumber
      ].filter(Boolean),
      transporters: {
        create: { ...input.transporters!.create!, ...transporterData }
      }
    };
  }

  if (destination) {
    input = {
      ...input,
      destinationCompanyName: destination.company.name,
      destinationCompanySiret: destination.company.siret,
      destinationCompanyAddress: destination.company.address,
      destinationCompanyContact: destination.user.name,
      destinationCompanyPhone: destination.company.contactPhone,
      destinationCompanyMail: destination.company.contactEmail
    };
  }

  return prisma.bsff.create({
    data: input,
    include: {
      packagings: { include: { previousPackagings: true } },
      transporters: true,
      ficheInterventions: true
    }
  });
}

export function createBsffBeforeEmission(
  companies: SetRequired<BsffFactoryCompanies, "emitter" | "destination">,
  opts: BsffFactoryOpts = {}
) {
  return createBsff(companies, {
    ...opts,
    data: {
      isDraft: false,
      wasteCode: BSFF_WASTE_CODES[0],
      wasteAdr: "Mention ADR",
      wasteDescription: "Fluides",
      weightValue: 1,
      weightIsEstimate: false,
      destinationPlannedOperationCode: OPERATION.D10.code,
      destinationCap: "CAP",
      ...opts.data
    }
  });
}

export function createBsffAfterEmission(
  companies: SetRequired<BsffFactoryCompanies, "emitter" | "destination">,
  opts: BsffFactoryOpts = {}
) {
  return createBsffBeforeEmission(companies, {
    ...opts,
    data: {
      status: BsffStatus.SIGNED_BY_EMITTER,
      emitterEmissionSignatureAuthor: companies.emitter.user.name,
      emitterEmissionSignatureDate: new Date().toISOString(),
      ...opts.data
    }
  });
}

export function createBsffBeforeTransport(
  companies: Required<BsffFactoryCompanies>,
  opts: BsffFactoryOpts = {}
) {
  return createBsffAfterEmission(companies, {
    ...opts,
    transporterData: {
      transporterTransportMode: TransportMode.ROAD,
      transporterTransportPlates: ["TRANSPORTER-PLATE"],
      transporterTransportTakenOverAt: new Date(),
      ...opts.transporterData
    }
  });
}

export function createBsffAfterTransport(
  companies: Required<BsffFactoryCompanies>,
  opts: BsffFactoryOpts = {}
) {
  return createBsffBeforeTransport(companies, {
    ...opts,
    data: {
      status: BsffStatus.SENT,
      transporterTransportSignatureDate: new Date().toISOString(),
      ...opts.data
    },
    transporterData: {
      transporterTransportSignatureAuthor: companies.transporter.user.name,
      transporterTransportSignatureDate: new Date().toISOString(),
      ...opts.transporterData
    }
  });
}

export function createBsffBeforeReception(
  companies: Required<BsffFactoryCompanies>,
  opts: BsffFactoryOpts = {}
) {
  return createBsffAfterTransport(companies, {
    ...opts,
    data: {
      destinationReceptionDate: new Date().toISOString(),
      ...opts.data
    },
    packagingData: {
      acceptationWeight: 1,
      acceptationStatus: WasteAcceptationStatus.ACCEPTED,
      acceptationWasteCode: "14 06 01*",
      acceptationWasteDescription: "fluide",
      ...opts.packagingData
    }
  });
}

export function createBsffBeforeRefusal(
  companies: Required<BsffFactoryCompanies>,
  opts: BsffFactoryOpts = {}
) {
  return createBsffAfterReception(companies, {
    ...opts,
    packagingData: {
      acceptationWeight: 0,
      acceptationDate: new Date(),
      acceptationStatus: WasteAcceptationStatus.REFUSED,
      acceptationRefusalReason: "non conforme",
      acceptationWasteCode: "14 06 01*",
      acceptationWasteDescription: "fluide",
      ...opts.packagingData
    }
  });
}

export function createBsffAfterReception(
  companies: Required<BsffFactoryCompanies>,
  opts: BsffFactoryOpts = {}
) {
  return createBsffBeforeReception(companies, {
    ...opts,
    data: {
      status: BsffStatus.RECEIVED,
      destinationReceptionSignatureDate: new Date().toISOString(),
      destinationReceptionSignatureAuthor:
        companies.destination.company.contact,
      ...opts.data
    }
  });
}

export function createBsffBeforeAcceptation(
  companies: Required<BsffFactoryCompanies>,
  opts: BsffFactoryOpts = {}
) {
  return createBsffAfterReception(companies, {
    ...opts,
    data: { status: BsffStatus.RECEIVED, ...opts.data },
    packagingData: {
      acceptationWeight: 1,
      acceptationStatus: WasteAcceptationStatus.ACCEPTED,
      acceptationWasteCode: "14 06 01*",
      acceptationWasteDescription: "fluide",
      acceptationDate: new Date(),
      ...opts.packagingData
    }
  });
}

export function createBsffAfterAcceptation(
  companies: Required<BsffFactoryCompanies>,
  opts: BsffFactoryOpts = {}
) {
  return createBsffBeforeAcceptation(companies, {
    ...opts,
    data: { status: BsffStatus.ACCEPTED, ...opts.data },
    packagingData: {
      acceptationSignatureAuthor: "Juste Leblanc",
      acceptationSignatureDate: new Date().toISOString(),
      ...opts.packagingData
    }
  });
}

export function createBsffBeforeOperation(
  companies: Required<BsffFactoryCompanies>,
  opts: BsffFactoryOpts = {}
) {
  return createBsffAfterAcceptation(companies, {
    ...opts,
    packagingData: {
      operationCode: OPERATION.R2.code,
      operationMode: OperationMode.REUTILISATION,
      operationDate: new Date(),
      operationDescription: "réutilisation",
      ...opts.packagingData
    }
  });
}

export function createBsffAfterOperation(
  companies: Required<BsffFactoryCompanies>,
  opts: BsffFactoryOpts = {}
) {
  return createBsffBeforeOperation(companies, {
    ...opts,
    data: { status: BsffStatus.PROCESSED, ...opts.data },
    packagingData: {
      operationSignatureAuthor: "Juste Leblanc",
      operationSignatureDate: new Date().toISOString(),
      ...opts.packagingData
    }
  });
}

export function createBsffPackaging(
  args: Partial<Prisma.BsffPackagingCreateInput>,
  previousPackagings?: BsffPackaging[]
) {
  return {
    type: BsffPackagingType.BOUTEILLE,
    numero: "1234",
    emissionNumero: "1234",
    weight: 1,
    volume: 1,
    ...args,
    ...(previousPackagings
      ? {
          previousPackagings: {
            connect: previousPackagings.map(p => ({ id: p.id }))
          }
        }
      : {})
  };
}

interface CreateFicheInterventionArgs {
  operateur: UserWithCompany;
  detenteur: UserWithCompany;
}

export function createFicheIntervention({
  operateur,
  detenteur
}: CreateFicheInterventionArgs) {
  const data: Prisma.BsffFicheInterventionCreateInput = {
    operateurCompanyAddress: operateur.company.address!,
    operateurCompanyContact: operateur.user.name,
    operateurCompanyMail: operateur.company.contactEmail!,
    operateurCompanyName: operateur.company.name,
    operateurCompanyPhone: operateur.company.contactPhone!,
    operateurCompanySiret: operateur.company.siret!,
    detenteurCompanyAddress: detenteur.company.address!,
    detenteurCompanyContact: detenteur.user.name,
    detenteurCompanyMail: detenteur.company.contactEmail,
    detenteurCompanyName: detenteur.company.name,
    detenteurCompanyPhone: detenteur.company.contactPhone,
    detenteurCompanySiret: detenteur.company.siret,
    postalCode: "75000",
    weight: 1,
    numero: "123"
  };

  return prisma.bsffFicheIntervention.create({ data });
}

type AddBsffTransporterOpt = {
  bsffId: string;
  transporter: UserWithCompany;
  opt: { transporterTransportPlates: string[] };
};

export const addBsffTransporter = async ({
  bsffId,
  transporter,
  opt
}: AddBsffTransporterOpt) => {
  const count = await prisma.bsffTransporter.count({ where: { bsffId } });

  let transporterData: Omit<Prisma.BsffTransporterCreateInput, "number"> = {
    transporterCompanyName: transporter.company.name,
    transporterCompanySiret: transporter.company.siret,
    transporterCompanyAddress: transporter.company.address,
    transporterCompanyContact: transporter.user.name,
    transporterCompanyPhone: transporter.company.contactPhone,
    transporterCompanyMail: transporter.company.contactEmail,
    transporterCompanyVatNumber: transporter.company.vatNumber,
    transporterTransportPlates: opt?.transporterTransportPlates
  };
  const transporterReceipt = await prisma.company
    .findUnique({
      where: { id: transporter.company.id }
    })
    .transporterReceipt();

  if (transporterReceipt) {
    transporterData = {
      ...transporterData,
      transporterRecepisseIsExempted: false,
      transporterRecepisseNumber: transporterReceipt.receiptNumber,
      transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
      transporterRecepisseDepartment: transporterReceipt.department
    };
  }
  return prisma.bsffTransporter.create({
    data: {
      ...transporterData,
      number: count + 1,
      bsff: { connect: { id: bsffId } }
    }
  });
};
