import * as yup from "yup";
import {
  Company,
  CompanyType,
  CompanyVerificationStatus
} from "@prisma/client";
import { MISSING_COMPANY_SIRET_OR_VAT } from "../forms/errors";
import prisma from "../prisma";
import {
  isForeignVat,
  isFRVat,
  isSiret
} from "../common/constants/companySearchHelpers";

export const receiptSchema = yup.object().shape({
  validityLimit: yup.date().required()
});

export function isCollector(company: Company) {
  return company.companyTypes.includes(CompanyType.COLLECTOR);
}

export function isWasteProcessor(company: Company) {
  return company.companyTypes.includes(CompanyType.WASTEPROCESSOR);
}

export function isWasteCenter(company: Company) {
  return company.companyTypes.includes(CompanyType.WASTE_CENTER);
}

export function isTransporter(company: Company) {
  return company.companyTypes.includes(CompanyType.TRANSPORTER);
}

const { VERIFY_COMPANY } = process.env;

export const destinationCompanySiretSchema = yup
  .string()
  .ensure()
  .test(
    "is-siret",
    "Destination: ${originalValue} n'est pas un numéro de SIRET valide",
    value => !value || isSiret(value)
  )
  .test(
    "is-recipient-registered-with-right-profile",
    ({ value }) =>
      `L'installation de destination avec le SIRET ${value} n'est pas inscrite sur Trackdéchets`,
    async (siret, ctx) => {
      if (!siret) return true;

      const company = await prisma.company.findUnique({
        where: { siret }
      });
      if (!company) {
        return false;
      }

      if (!(isCollector(company) || isWasteProcessor(company))) {
        throw ctx.createError({
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
        throw ctx.createError({
          message:
            `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue` +
            ` avec le SIRET ${siret} n'a pas encore été vérifié. Cette installation ne peut pas être visée sur le bordereau bordereau.`
        });
      }

      return true;
    }
  );

export const transporterCompanySiretSchema = (isDraft: boolean) =>
  yup
    .string()
    .ensure()
    .test(
      "is-transporter-registered-with-right-profile",
      ({ value }) =>
        `Le transporteur qui a été renseigné sur le bordereau (SIRET: ${value}) n'est pas inscrit sur Trackdéchets`,
      async (siret, ctx) => {
        if (!siret) return true;

        const company = await prisma.company.findUnique({
          where: { siret }
        });
        if (!company) {
          return false;
        }

        if (!isTransporter(company)) {
          throw ctx.createError({
            message:
              `Le transporteur saisi sur le bordereau (SIRET: ${siret}) n'est pas inscrit sur Trackdéchets` +
              ` en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
              ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
              ` de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
          });
        }

        return true;
      }
    )
    .test(
      "is-siret",
      "Transporteur : ${originalValue} n'est pas un numéro de SIRET valide",
      value => !value || isSiret(value)
    )
    .when("transporterCompanyVatNumber", (tva, schema) => {
      if (!tva && !isDraft) {
        return schema.required(
          `Transporteur : ${MISSING_COMPANY_SIRET_OR_VAT}`
        );
      }
      return schema.nullable().notRequired();
    });

export const transporterCompanyVatNumberSchema = yup
  .string()
  .ensure()
  .test(
    "is-foreign-vat",
    "Transporteur: ${originalValue} n'est pas un numéro de TVA étranger valide",
    (value, testContext) => {
      if (!value) return true;
      else if (isFRVat(value)) {
        return testContext.createError({
          message:
            "Transporteur : Le numéro SIRET est obligatoire pour un établissement français"
        });
      } else if (isForeignVat(value)) {
        return true;
      }
    }
  );
