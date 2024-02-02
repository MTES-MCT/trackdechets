import {
  Company,
  Prisma,
  BsffStatus,
  BsffPackaging,
  BsffType
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { getReadableId, reindex, ReadableIdPrefix } from "back";

interface BsffOpt {
  status?: BsffStatus;
  destinationCap?: string;
  packagings?: Partial<BsffPackaging>[];
  wasteCode?: string;
  type?: BsffType;
  // Companies
  operateur?: Company;
  detenteur?: Company;
  destination?: Company;
  transporter?: Company;
}

[{ emissionNumero: "", type: "BOUTEILLE", weight: 1, numero: "" }];

const optToBsffCreateInput = (opt: BsffOpt): Prisma.BsffCreateInput => {
  return {
    id: getReadableId(ReadableIdPrefix.FF),
    status: opt.status ?? BsffStatus.PROCESSED,
    destinationCap: opt.destinationCap,
    wasteCode: opt.wasteCode,
    type: opt.type,
    // Companies
    destinationCompanySiret: opt.destination?.siret,
    destinationCompanyName: opt.destination?.name,
    transporterCompanySiret: opt.transporter?.siret,
    transporterCompanyName: opt.transporter?.name,
    detenteurCompanySirets: opt.detenteur ? [opt.detenteur.siret!] : [],
    ...(opt.packagings
      ? {
          packagings: {
            createMany: {
              data: opt.packagings.map(packaging => ({
                type: "BOUTEILLE",
                emissionNumero: "emissionNumero",
                numero: "numero",
                volume: 1,
                weight: 1,
                ...packaging
              }))
            }
          }
        }
      : {})
  };
};

export const seedBsff = async (opt: BsffOpt) => {
  const bsff = await prisma.bsff.create({
    data: optToBsffCreateInput(opt)
  });

  if (opt.operateur && opt.detenteur) {
    const data: Prisma.BsffFicheInterventionCreateInput = {
      // Operateur
      operateurCompanyName: opt.operateur.name,
      operateurCompanySiret: opt.operateur.siret!,
      operateurCompanyAddress: opt.operateur.address ?? "",
      operateurCompanyContact: opt.operateur.contact ?? "",
      operateurCompanyPhone: opt.operateur.contactPhone ?? "",
      operateurCompanyMail: opt.operateur.contactEmail ?? "",
      // Detenteur
      detenteurCompanyName: opt.detenteur.name,
      detenteurCompanySiret: opt.detenteur.siret,
      detenteurCompanyContact: opt.detenteur.contact ?? "",
      detenteurCompanyAddress: opt.detenteur.address ?? "",
      postalCode: "75000",
      weight: 1,
      numero: "123"
    };

    const fiche = await prisma.bsffFicheIntervention.create({ data });

    await prisma.bsff.update({
      where: { id: bsff.id },
      data: { ficheInterventions: { connect: { id: fiche.id } } }
    });
  }

  // Add the bsff to ES
  await reindex(bsff.id, () => {});

  return bsff;
};
