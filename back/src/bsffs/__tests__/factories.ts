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
import prisma from "../../prisma";
import { UserWithCompany } from "../../__tests__/factories";
import { OPERATION } from "../constants";
import { BSFF_WASTE_CODES } from "shared/constants";

interface CreateBsffArgs {
  emitter?: UserWithCompany;
  transporter?: UserWithCompany;
  destination?: UserWithCompany;
  previousPackagings?: BsffPackaging[];
}

export async function createBsff(
  {
    emitter,
    transporter,
    destination,
    previousPackagings
  }: CreateBsffArgs = {},
  initialData: Partial<Prisma.BsffCreateInput> = {},
  initialPackagingData: Partial<Prisma.BsffPackagingCreateInput> = {}
) {
  const data: Prisma.BsffCreateInput = {
    id: getReadableId(ReadableIdPrefix.FF),
    type: BsffType.TRACER_FLUIDE,
    status: BsffStatus.INITIAL,
    packagings: {
      create: createBsffPackaging(initialPackagingData, previousPackagings)
    },
    ...initialData
  };

  if (emitter) {
    Object.assign(data, {
      emitterCompanyName: emitter.company.name,
      emitterCompanySiret: emitter.company.siret,
      emitterCompanyAddress: emitter.company.address,
      emitterCompanyContact: emitter.user.name,
      emitterCompanyPhone: emitter.company.contactPhone,
      emitterCompanyMail: emitter.company.contactEmail
    });
  }

  if (transporter) {
    Object.assign(data, {
      transporterCompanyName: transporter.company.name,
      transporterCompanySiret: transporter.company.siret,
      transporterCompanyAddress: transporter.company.address,
      transporterCompanyContact: transporter.user.name,
      transporterCompanyPhone: transporter.company.contactPhone,
      transporterCompanyMail: transporter.company.contactEmail,
      transporterCompanyVatNumber: transporter.company.vatNumber
    });
    const transporterReceipt = await prisma.company
      .findUnique({
        where: { id: transporter.company.id }
      })
      .transporterReceipt();
    if (transporterReceipt) {
      Object.assign(data, {
        transporterRecepisseNumber: transporterReceipt.receiptNumber,
        transporterRecepisseValidityLimit: transporterReceipt.validityLimit,
        transporterRecepisseDepartment: transporterReceipt.department
      });
    }
  }

  if (destination) {
    Object.assign(data, {
      destinationCompanyName: destination.company.name,
      destinationCompanySiret: destination.company.siret,
      destinationCompanyAddress: destination.company.address,
      destinationCompanyContact: destination.user.name,
      destinationCompanyPhone: destination.company.contactPhone,
      destinationCompanyMail: destination.company.contactEmail
    });
  }

  return prisma.bsff.create({ data, include: { packagings: true } });
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

export function createBsffBeforeEmission(
  args: SetRequired<CreateBsffArgs, "emitter">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsff(args, {
    isDraft: false,
    wasteCode: BSFF_WASTE_CODES[0],
    wasteAdr: "Mention ADR",
    wasteDescription: "Fluides",
    weightValue: 1,
    weightIsEstimate: false,
    destinationPlannedOperationCode: OPERATION.D10.code,
    ...initialData
  });
}

export function createBsffAfterEmission(
  args: SetRequired<CreateBsffArgs, "emitter">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffBeforeEmission(args, {
    status: BsffStatus.SIGNED_BY_EMITTER,
    emitterEmissionSignatureAuthor: args.emitter.user.name,
    emitterEmissionSignatureDate: new Date().toISOString(),
    ...initialData
  });
}

export function createBsffBeforeTransport(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffAfterEmission(args, {
    packagings: {
      create: createBsffPackagingBeforeTransport({}, args.previousPackagings)
    },
    transporterTransportMode: TransportMode.ROAD,
    transporterTransportPlates: ["TRANSPORTER-PLATE"],
    transporterTransportTakenOverAt: new Date(),
    ...initialData
  });
}

export function createBsffPackagingBeforeTransport(
  args: Partial<Prisma.BsffPackagingCreateInput>,
  previousPackagings?: BsffPackaging[]
) {
  return createBsffPackaging(
    {
      type: "AUTRE",
      other: "BOUTEILLE de récup",
      operationSignatureAuthor: "John Snow",
      weight: 1,
      volume: 1,
      ...args
    },
    previousPackagings
  );
}

export function createBsffAfterTransport(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffBeforeTransport(args, {
    status: BsffStatus.SENT,
    transporterTransportSignatureAuthor: args.transporter.user.name,
    transporterTransportSignatureDate: new Date().toISOString(),
    transporterTransportTakenOverAt: new Date().toISOString(),
    transporterTransportPlates: ["TRANSPORER-PLATE"],
    ...initialData
  });
}

export function createBsffBeforeReception(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffAfterTransport(args, {
    destinationReceptionDate: new Date().toISOString(),
    packagings: {
      create: createBsffPackagingBeforeAcceptation({}, args.previousPackagings)
    },
    ...initialData
  });
}

export function createBsffBeforeRefusal(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffAfterReception(args, {
    packagings: {
      create: createBsffPackagingInputBeforeRefusal({}, args.previousPackagings)
    },
    ...initialData
  });
}

export function createBsffPackagingInputBeforeRefusal(
  args: Partial<Prisma.BsffPackagingCreateInput>,
  previousPackagings?: BsffPackaging[]
) {
  return createBsffPackaging(
    {
      acceptationWeight: 0,
      acceptationStatus: WasteAcceptationStatus.REFUSED,
      acceptationRefusalReason: "non conforme",
      acceptationWasteCode: "14 06 01*",
      acceptationWasteDescription: "fluide",
      ...args
    },
    previousPackagings
  );
}

export function createBsffAfterReception(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffBeforeReception(args, {
    status: BsffStatus.RECEIVED,
    destinationReceptionSignatureDate: new Date().toISOString(),
    ...initialData
  });
}

export function createBsffPackagingBeforeAcceptation(
  args: Partial<Prisma.BsffPackagingCreateInput>,
  previousPackagings?: BsffPackaging[]
) {
  return createBsffPackagingBeforeTransport(
    {
      acceptationWeight: 1,
      acceptationStatus: WasteAcceptationStatus.ACCEPTED,
      acceptationWasteCode: "14 06 01*",
      acceptationWasteDescription: "fluide",
      ...args
    },
    previousPackagings
  );
}

export function createBsffBeforeAcceptation(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffAfterReception(args, {
    status: BsffStatus.RECEIVED,
    packagings: {
      create: createBsffPackagingBeforeAcceptation({}, args.previousPackagings)
    },
    ...initialData
  });
}

export function createBsffPackagingAfterAcceptation(
  args: Partial<Prisma.BsffPackagingCreateInput>,
  previousPackagings?: BsffPackaging[]
) {
  return createBsffPackagingBeforeAcceptation(
    {
      acceptationSignatureAuthor: "Juste Leblanc",
      acceptationSignatureDate: new Date().toISOString(),
      ...args
    },
    previousPackagings
  );
}

export function createBsffAfterAcceptation(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffBeforeAcceptation(args, {
    status: BsffStatus.ACCEPTED,
    packagings: {
      create: createBsffPackagingAfterAcceptation({}, args.previousPackagings)
    },
    ...initialData
  });
}

export function createBsffPackagingBeforeOperation(
  args: Partial<Prisma.BsffPackagingCreateInput>,
  previousPackagings?: BsffPackaging[]
) {
  return createBsffPackagingAfterAcceptation(
    {
      operationCode: OPERATION.R2.code,
      operationMode: OperationMode.REUTILISATION,
      operationDate: new Date(),
      ...args
    },
    previousPackagings
  );
}

export function createBsffBeforeOperation(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {},
  packagingData: Partial<Prisma.BsffPackagingCreateInput> = {}
) {
  return createBsffAfterReception(args, {
    packagings: {
      create: createBsffPackagingBeforeOperation(
        packagingData,
        args.previousPackagings
      )
    },
    ...initialData
  });
}

export function createBsffPackagingAfterOperation(
  args: Partial<Prisma.BsffPackagingCreateInput>,
  previousPackagings?: BsffPackaging[]
) {
  return createBsffPackagingBeforeOperation(
    {
      operationSignatureAuthor: "Juste Leblanc",
      operationSignatureDate: new Date().toISOString(),
      ...args
    },
    previousPackagings
  );
}

export function createBsffAfterOperation(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {},
  packagingData: Partial<Prisma.BsffPackagingCreateInput> = {}
) {
  return createBsffBeforeOperation(args, {
    status: BsffStatus.PROCESSED,
    packagings: {
      create: createBsffPackagingAfterOperation(
        packagingData,
        args.previousPackagings
      )
    },
    ...initialData
  });
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
