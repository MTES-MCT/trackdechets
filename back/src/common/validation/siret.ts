import { z } from "zod";
import {
  isForeignVat,
  isSiret,
  isVat
} from "../constants/companySearchHelpers";
import {
  isCollector,
  isTransporter,
  isWasteCenter,
  isWasteProcessor,
  isWasteVehicles,
  isWorker
} from "../../companies/validation";
import { CompanyVerificationStatus } from "@prisma/client";
import prisma from "../../prisma";

const { VERIFY_COMPANY } = process.env;

export const siretSchema = z
  .string({ required_error: "le N° SIRET est obligatoire" })
  .refine(
    value => {
      if (!value) {
        return true;
      }
      return isSiret(value);
    },
    val => ({ message: `${val} n'est pas un numéro de SIRET valide` })
  );

export const vatNumberSchema = z.string().refine(
  value => {
    if (!value) {
      return true;
    }
    return isVat(value);
  },
  val => ({ message: `${val} n'est pas un numéro de TVA valide` })
);

export const foreignVatNumberSchema = vatNumberSchema.refine(value => {
  if (!value) return true;
  return isForeignVat(value);
}, "Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement");

export const isRegisteredSiretRefinement =
  role => async (siret: string, ctx) => {
    if (!siret) return;
    const company = await prisma.company.findUnique({
      where: { siret }
    });

    if (company === null) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `L'établissement avec le SIRET ${siret} n'est pas inscrit sur Trackdéchets`
      });
    }
    if (role === "DESTINATION") {
      if (
        !isCollector(company) &&
        !isWasteProcessor(company) &&
        !isWasteCenter(company) &&
        !isWasteVehicles(company)
      ) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET "${siret}" n'est pas inscrite` +
            ` sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut` +
            ` donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il` +
            ` modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
        });
      }
      if (
        VERIFY_COMPANY === "true" &&
        company.verificationStatus !== CompanyVerificationStatus.VERIFIED
      ) {
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue` +
            ` avec le SIRET ${siret} n'a pas encore été vérifié. Cette installation ne peut pas être visée sur le bordereau.`
        });
      }
    }
    if (role === "TRANSPORTER" && !isTransporter(company)) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          `Le transporteur saisi sur le bordereau (SIRET: ${siret}) n'est pas inscrit sur Trackdéchets` +
          ` en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
          ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
          ` de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
      });
    }
    if (role === "WORKER" && !isWorker(company)) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          `L'entreprise de travaux saisie sur le bordereau (SIRET: ${siret}) n'est pas inscrite sur Trackdéchets` +
          ` en tant qu'entreprise de travaux. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
          ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
          ` de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
      });
    }
  };

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
