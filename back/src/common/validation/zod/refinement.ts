import { RefinementCtx, z } from "zod";
import {
  isCollector,
  isTransporter,
  isWasteCenter,
  isWasteProcessor,
  isWasteVehicles
} from "../../../companies/validation";
import { prisma } from "@td/prisma";
import { Company, CompanyVerificationStatus } from "@prisma/client";
import { getOperationModesFromOperationCode } from "../../operationModes";
import { CompanyRole } from "./schema";

const { VERIFY_COMPANY } = process.env;

export async function isTransporterRefinement(
  {
    siret,
    transporterRecepisseIsExempted
  }: {
    siret: string | null | undefined;
    transporterRecepisseIsExempted: boolean;
  },
  ctx: RefinementCtx
) {
  if (transporterRecepisseIsExempted) return;

  const company = await refineSiretAndGetCompany(
    siret,
    ctx,
    CompanyRole.Transporter
  );

  if (company && !isTransporter(company)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        `Le transporteur saisi sur le bordereau (SIRET: ${siret}) n'est pas inscrit sur Trackdéchets` +
        ` en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
        ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
        ` de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
    });
  }
}
export async function refineSiretAndGetCompany(
  siret: string | null | undefined,
  ctx: RefinementCtx,
  companyRole?: CompanyRole
): Promise<Company | null> {
  if (!siret) return null;
  const company = await prisma.company.findUnique({
    where: { siret }
  });

  if (company === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${
        companyRole ? `${companyRole} : ` : ""
      }L'établissement avec le SIRET ${siret} n'est pas inscrit sur Trackdéchets`
    });
  }

  if (company?.isDormantSince) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `L'établissement avec le SIRET ${siret} est en sommeil sur Trackdéchets, il n'est pas possible de le mentionner sur un bordereau`
    });
  }

  return company;
}
export const isRegisteredVatNumberRefinement = async (
  vatNumber: string | null | undefined,
  ctx: RefinementCtx
) => {
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
        ` de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
    });
  }
};
export async function isDestinationRefinement(
  siret: string | null | undefined,
  ctx: RefinementCtx,
  role: "DESTINATION" | "WASTE_VEHICLES" = "DESTINATION",
  isExemptedFromVerification?: (destination: Company | null) => boolean
) {
  const company = await refineSiretAndGetCompany(
    siret,
    ctx,
    CompanyRole.Destination
  );

  if (company && role === "WASTE_VEHICLES" && !isWasteVehicles(company)) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        `L'installation de destination avec le SIRET "${siret}" n'est pas inscrite` +
        ` sur Trackdéchets en tant qu'installation de traitement de VHU. Cette installation ne peut` +
        ` donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il` +
        ` modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
    });
  } else if (
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
        ` modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
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

export async function isNotDormantRefinement(
  siret: string | null | undefined,
  ctx: RefinementCtx
) {
  if (!siret) return null;
  const company = await prisma.company.findUnique({
    where: { siret }
  });

  if (company?.isDormantSince) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `L'établissement avec le SIRET ${siret} est en sommeil sur Trackdéchets, il n'est pas possible de le mentionner sur un bordereau`
    });
  }
}

export function destinationOperationModeRefinement(
  destinationOperationCode: string | null | undefined,
  destinationOperationMode: string | null | undefined,
  ctx: RefinementCtx
) {
  if (destinationOperationCode) {
    const modes = getOperationModesFromOperationCode(destinationOperationCode);

    if (modes.length && !destinationOperationMode) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vous devez préciser un mode de traitement"
      });
    } else if (
      (modes.length &&
        destinationOperationMode &&
        !modes.includes(destinationOperationMode)) ||
      (!modes.length && destinationOperationMode)
    ) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
      });
    }
  }
}
