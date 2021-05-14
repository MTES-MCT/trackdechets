import { Company, Prisma, TransportMode, User } from ".prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import prisma from "../../prisma";
import { PACKAGING_TYPE, WASTE_CODES } from "../constants";

interface UserAndCompany {
  user: User;
  company: Company;
}

export function createBsff(
  {
    emitter,
    transporter
  }: {
    emitter?: UserAndCompany;
    transporter?: UserAndCompany;
  } = {},
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  const data = {
    id: getReadableId(ReadableIdPrefix.FF),
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

  return prisma.bsff.create({ data });
}

export function createBsffBeforeEmission(
  {
    emitter,
    transporter
  }: {
    emitter: UserAndCompany;
    transporter?: UserAndCompany;
  },
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsff(
    { emitter, transporter },
    {
      wasteCode: WASTE_CODES[0],
      wasteDescription: "Fluides",
      quantityKilos: 1,
      ...initialData
    }
  );
}

export function createBsffAfterEmission(
  {
    emitter,
    transporter
  }: {
    emitter: UserAndCompany;
    transporter?: UserAndCompany;
  },
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffBeforeEmission(
    { emitter, transporter },
    {
      emitterEmissionSignatureAuthor: emitter.user.name,
      emitterEmissionSignatureDate: new Date().toISOString(),
      ...initialData
    }
  );
}

export function createBsffBeforeTransport(
  {
    emitter,
    transporter
  }: {
    emitter: UserAndCompany;
    transporter: UserAndCompany;
  },
  initialData: Partial<Prisma.BsffCreateInput> = {}
) {
  return createBsffAfterEmission(
    { emitter, transporter },
    {
      packagings: [{ type: PACKAGING_TYPE.BOUTEILLE, numero: "01", litres: 1 }],
      wasteAdr: "Mention ADR",
      transporterTransportMode: TransportMode.ROAD,
      ...initialData
    }
  );
}
