import { z } from "zod";
import {
  isCollector,
  isTransporter,
  isWasteCenter,
  isWasteProcessor,
  isWasteVehicles
} from "../../../companies/validation";
import { prisma } from "@td/prisma";
import { Company, CompanyVerificationStatus } from "@prisma/client";

const { VERIFY_COMPANY } = process.env;

export async function isTransporterRefinement(
  {
    siret,
    transporterRecepisseIsExempted
  }: {
    siret: string | null | undefined;
    transporterRecepisseIsExempted: boolean;
  },
  ctx
) {
  if (transporterRecepisseIsExempted) return;

  const company = await refineSiretAndGetCompany(siret, ctx);

  if (company && !isTransporter(company)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        `Le transporteur saisi sur le bordereau (SIRET: ${siret}) n'est pas inscrit sur Trackdéchets` +
        ` en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
        ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
        ` de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
    });
  }
}
export async function refineSiretAndGetCompany(
  siret: string | null | undefined,
  ctx
): Promise<Company | null> {
  if (!siret) return null;
  const company = await prisma.company.findUnique({
    where: { siret }
  });

  if (company === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `L'établissement avec le SIRET ${siret} n'est pas inscrit sur Trackdéchets`
    });
  }

  return company;
}
export const isRegisteredVatNumberRefinement = async (vatNumber, ctx) => {
  if (!vatNumber) return;
  const company = await prisma.company.findUnique({
    where: { vatNumber }
  });
  if (company === null) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le transporteur avec le n°de TVA ${vatNumber} n'est pas inscrit sur Trackdéchets`
    });
  }
  if (!isTransporter(company)) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        `Le transporteur saisi sur le bordereau (numéro de TVA: ${vatNumber}) n'est pas inscrit sur Trackdéchets` +
        ` en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
        ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
        ` de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
    });
  }
};
export async function isDestinationRefinement(
  siret: string | null | undefined,
  ctx,
  isExemptedFromVerification?: (destination: Company | null) => boolean
) {
  const company = await refineSiretAndGetCompany(siret, ctx);

  if (
    company &&
    !isCollector(company) &&
    !isWasteProcessor(company) &&
    !isWasteCenter(company) &&
    !isWasteVehicles(company)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET "${siret}" n'est pas inscrite` +
        ` sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut` +
        ` donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il` +
        ` modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
    });
  }

  if (
    company &&
    VERIFY_COMPANY === "true" &&
    company.verificationStatus !== CompanyVerificationStatus.VERIFIED
  ) {
    if (isExemptedFromVerification && isExemptedFromVerification(company)) {
      return true;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue` +
        ` avec le SIRET ${siret} n'a pas encore été vérifié. Cette installation ne peut pas être visée sur le bordereau.`
    });
  }
}
