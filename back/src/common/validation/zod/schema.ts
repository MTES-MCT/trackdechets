import { z } from "zod";
import { TransportMode } from "@td/prisma";
import { isForeignVat, isSiret, isVat } from "@td/constants";
import { ERROR_TRANSPORTER_PLATES_TOO_MANY } from "../messages";

export enum CompanyRole {
  Emitter = "Émetteur",
  Transporter = "Transporteur",
  Destination = "Destination",
  EcoOrganisme = "Éco-organisme",
  Broker = "Courtier",
  Trader = "Trader",
  Worker = "Entreprise de travaux",
  Intermediary = "Intermédiaire",
  NextDestination = "Éxutoire",
  DestinationOperationNextDestination = "Éxutoire final"
}

export const pathFromCompanyRole = (
  companyRole?: CompanyRole,
  index?: number
): string[] => {
  switch (companyRole) {
    case CompanyRole.Emitter:
      return ["emitter", "company", "siret"];
    case CompanyRole.Transporter:
      if (index) {
        return ["transporters", `${index + 1}`, "company", "siret"];
      }
      return ["transporter", "company", "siret"];
    case CompanyRole.Destination:
      return ["destination", "company", "siret"];
    case CompanyRole.EcoOrganisme:
      return ["ecoOrganisme", "siret"];
    case CompanyRole.Broker:
      return ["broker", "company", "siret"];
    case CompanyRole.Trader:
      return ["trader", "company", "siret"];
    case CompanyRole.Worker:
      return ["worker", "company", "siret"];
    case CompanyRole.Intermediary:
      return ["intermediaries", "company", "siret"];
    case CompanyRole.NextDestination:
      return ["nextDestination", "company", "siret"];
    case CompanyRole.DestinationOperationNextDestination:
      return [
        "destination",
        "operation",
        "nextDestination",
        "company",
        "siret"
      ];
    default:
      return [];
  }
};

export const siretSchema = (expectedCompanyRole?: CompanyRole) =>
  z
    .string({
      required_error: `${
        expectedCompanyRole ? `${expectedCompanyRole} : ` : ""
      }le SIRET est obligatoire`
    })
    .refine(
      value => {
        if (!value) {
          return true;
        }
        return isSiret(value);
      },
      val => ({
        path: pathFromCompanyRole(expectedCompanyRole),
        message: `${
          expectedCompanyRole ? `${expectedCompanyRole} : ` : ""
        }${val} n'est pas un SIRET valide`
      })
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
export const foreignVatNumberSchema = (expectedCompanyRole?: CompanyRole) =>
  vatNumberSchema.refine(
    value => {
      if (!value) return true;
      return isForeignVat(value);
    },
    {
      path: pathFromCompanyRole(expectedCompanyRole),
      message: `${
        expectedCompanyRole ? `${expectedCompanyRole} : ` : ""
      }Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement`
    }
  );

export const rawTransporterSchema = z.object({
  id: z.string().nullish(),
  number: z.number().nullish(),
  transporterCompanyName: z.string().nullish(),
  transporterCompanySiret: siretSchema(CompanyRole.Transporter).nullish(),
  transporterCompanyAddress: z.string().nullish(),
  transporterCompanyContact: z.string().nullish(),
  transporterCompanyPhone: z.string().nullish(),
  transporterCompanyMail: z
    .string()
    .email("E-mail transporteur invalide")
    .nullish(),
  transporterCompanyVatNumber: foreignVatNumberSchema(
    CompanyRole.Transporter
  ).nullish(),
  transporterCustomInfo: z.string().nullish(),
  transporterRecepisseIsExempted: z
    .boolean()
    .nullish()
    .transform(v => Boolean(v)),
  transporterRecepisseNumber: z.string().nullish(),
  transporterRecepisseDepartment: z.string().nullish(),
  transporterRecepisseValidityLimit: z.coerce.date().nullish(),
  transporterTransportMode: z.nativeEnum(TransportMode).nullish(),
  transporterTransportPlates: z
    .array(z.string())
    .max(2, ERROR_TRANSPORTER_PLATES_TOO_MANY)
    .default([]),
  transporterTransportTakenOverAt: z.coerce.date().nullish(),
  transporterTransportSignatureAuthor: z.string().nullish(),
  transporterTransportSignatureDate: z.coerce.date().nullish()
});
