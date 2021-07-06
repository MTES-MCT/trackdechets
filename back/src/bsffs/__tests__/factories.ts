import { SetRequired } from "type-fest";
import { Prisma, TransportMode, BsffStatus } from ".prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import prisma from "../../prisma";
import { UserWithCompany } from "../../__tests__/factories";
import { OPERATION_CODES, PACKAGING_TYPE, WASTE_CODES } from "../constants";

interface CreateBsffArgs {
  emitter?: UserWithCompany;
  transporter?: UserWithCompany;
  destination?: UserWithCompany;
}

export function createBsff(
  { emitter, transporter, destination }: CreateBsffArgs = {},
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  const data = {
    id: getReadableId(ReadableIdPrefix.FF),
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
    wasteCode: WASTE_CODES[0],
    wasteDescription: "Fluides",
    quantityKilos: 1,
    destinationPlannedOperationCode: OPERATION_CODES.D10,
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
    packagings: [{ type: PACKAGING_TYPE.BOUTEILLE, numero: "01", kilos: 1 }],
    wasteAdr: "Mention ADR",
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
  return createBsffBeforeTransport(args, {
    destinationReceptionDate: new Date().toISOString(),
    destinationReceptionKilos: 1,
    ...initialData
  });
}

export function createBsffAfterReception(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffBeforeReception(args, {
    status: initialData.destinationReceptionRefusal
      ? BsffStatus.REFUSED
      : BsffStatus.RECEIVED,
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
    destinationOperationCode: OPERATION_CODES.D10,
    ...initialData
  });
}

export function createBsffAfterOperation(
  args: SetRequired<CreateBsffArgs, "emitter" | "transporter" | "destination">,
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffAfterReception(args, {
    status: BsffStatus.PROCESSED,
    destinationOperationSignatureAuthor: args.destination.user.name,
    destinationOperationSignatureDate: new Date().toISOString(),
    ...initialData
  });
}
