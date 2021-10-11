import type { SetRequired } from "type-fest";
import {
  Prisma,
  TransportMode,
  BsffStatus,
  BsffType,
  WasteAcceptationStatus
} from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import prisma from "../../prisma";
import { UserWithCompany } from "../../__tests__/factories";
import { OPERATION, WASTE_CODES } from "../constants";

interface CreateBsffArgs {
  emitter?: UserWithCompany;
  transporter?: UserWithCompany;
  destination?: UserWithCompany;
}

export function createBsff(
  { emitter, transporter, destination }: CreateBsffArgs = {},
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  const data: Prisma.BsffCreateInput = {
    id: getReadableId(ReadableIdPrefix.FF),
    type: BsffType.TRACER_FLUIDE,
    status: BsffStatus.INITIAL,
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
      transporterCompanyMail: transporter.company.contactEmail
    });
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

  return prisma.bsff.create({ data });
}

export function createBsffBeforeEmission(
  args: SetRequired<CreateBsffArgs, "emitter">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsff(args, {
    isDraft: false,
    wasteCode: WASTE_CODES[0],
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
    packagings: [{ name: "BOUTEILLE 2L", numero: "01", weight: 1 }],
    transporterTransportMode: TransportMode.ROAD,
    ...initialData
  });
}

export function createBsffAfterTransport(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffBeforeTransport(args, {
    status: BsffStatus.SENT,
    transporterTransportSignatureAuthor: args.transporter.user.name,
    transporterTransportSignatureDate: new Date().toISOString(),
    ...initialData
  });
}

export function createBsffBeforeReception(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffAfterTransport(args, {
    destinationReceptionDate: new Date().toISOString(),
    destinationReceptionWeight: 1,
    destinationReceptionAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
    ...initialData
  });
}

export function createBsffBeforeRefusal(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffAfterTransport(args, {
    destinationReceptionDate: new Date().toISOString(),
    destinationReceptionWeight: 0,
    destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
    destinationReceptionRefusalReason: "non conforme",
    ...initialData
  });
}

export function createBsffAfterReception(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffBeforeReception(args, {
    status:
      initialData.destinationReceptionAcceptationStatus ===
      WasteAcceptationStatus.ACCEPTED
        ? BsffStatus.RECEIVED
        : BsffStatus.REFUSED,
    destinationReceptionSignatureAuthor: args.destination.user.name,
    destinationReceptionSignatureDate: new Date().toISOString(),
    ...initialData
  });
}

export function createBsffBeforeOperation(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffAfterReception(args, {
    destinationOperationCode: OPERATION.D10.code,
    ...initialData
  });
}

export function createBsffAfterOperation(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffBeforeOperation(args, {
    status: BsffStatus.PROCESSED,
    destinationOperationSignatureAuthor: args.destination.user.name,
    destinationOperationSignatureDate: new Date().toISOString(),
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
    operateurCompanyAddress: operateur.company.address,
    operateurCompanyContact: operateur.user.name,
    operateurCompanyMail: operateur.company.contactEmail,
    operateurCompanyName: operateur.company.name,
    operateurCompanyPhone: operateur.company.contactPhone,
    operateurCompanySiret: operateur.company.siret,
    detenteurCompanyAddress: detenteur.company.address,
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
