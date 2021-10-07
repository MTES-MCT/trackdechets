import {
  Consistence,
  EmitterType,
  Form,
  QuantityType,
  WasteAcceptationStatus,
  Prisma,
  CompanyVerificationStatus,
  Status
} from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import prisma from "../prisma";
import countries from "world-countries";
import * as yup from "yup";
import {
  isDangerous,
  PROCESSING_OPERATIONS_CODES,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES,
  WASTES_CODES
} from "../common/constants";
import configureYup, { FactorySchemaOf } from "../common/yup/configureYup";
import {
  AppendixFormInput,
  PackagingInfo,
  Packagings
} from "../generated/graphql/types";
import { isCollector, isWasteProcessor } from "../companies/validation";
import { getFinalDestinationSiret, getFormOrFormNotFound } from "./database";
import { FormAlreadyInAppendix2 } from "./errors";
// set yup default error messages
configureYup();

const { VERIFY_COMPANY } = process.env;

// ************************************************
// BREAK DOWN FORM TYPE INTO INDIVIDUAL FRAME TYPES
// ************************************************

type Emitter = Pick<
  Prisma.FormCreateInput,
  | "emitterType"
  | "emitterPickupSite"
  | "emitterWorkSiteName"
  | "emitterWorkSiteAddress"
  | "emitterWorkSiteCity"
  | "emitterWorkSitePostalCode"
  | "emitterWorkSiteInfos"
  | "emitterCompanyName"
  | "emitterCompanySiret"
  | "emitterCompanyAddress"
  | "emitterCompanyContact"
  | "emitterCompanyPhone"
  | "emitterCompanyMail"
>;

type Recipient = Pick<
  Prisma.FormCreateInput,
  | "recipientCap"
  | "recipientProcessingOperation"
  | "recipientIsTempStorage"
  | "recipientCompanyName"
  | "recipientCompanySiret"
  | "recipientCompanyAddress"
  | "recipientCompanyContact"
  | "recipientCompanyPhone"
  | "recipientCompanyMail"
>;

type WasteDetails = Pick<
  Prisma.FormCreateInput,
  | "wasteDetailsCode"
  | "wasteDetailsName"
  | "wasteDetailsOnuCode"
  | "wasteDetailsPackagingInfos"
  | "wasteDetailsPackagings"
  | "wasteDetailsOtherPackaging"
  | "wasteDetailsNumberOfPackages"
  | "wasteDetailsQuantity"
  | "wasteDetailsQuantityType"
  | "wasteDetailsConsistence"
  | "wasteDetailsPop"
>;

type Transporter = Pick<
  Prisma.FormCreateInput,
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "transporterIsExemptedOfReceipt"
  | "transporterReceipt"
  | "transporterDepartment"
  | "transporterValidityLimit"
  | "transporterNumberPlate"
  | "transporterCustomInfo"
>;

type ReceivedInfo = Pick<
  Prisma.FormCreateInput,
  | "isAccepted"
  | "wasteAcceptationStatus"
  | "wasteRefusalReason"
  | "receivedBy"
  | "receivedAt"
  | "signedAt"
  | "quantityReceived"
>;

type AcceptedInfo = Pick<
  Prisma.FormCreateInput,
  | "isAccepted"
  | "wasteAcceptationStatus"
  | "wasteRefusalReason"
  | "signedAt"
  | "signedBy"
  | "quantityReceived"
>;

type SigningInfo = Pick<
  Prisma.FormCreateInput,
  "sentAt" | "sentBy" | "signedByTransporter"
>;

type ProcessedInfo = Pick<
  Prisma.FormCreateInput,
  | "processedBy"
  | "processedAt"
  | "processingOperationDone"
  | "processingOperationDescription"
  | "noTraceability"
  | "nextDestinationProcessingOperation"
  | "nextDestinationCompanyName"
  | "nextDestinationCompanySiret"
  | "nextDestinationCompanyAddress"
  | "nextDestinationCompanyCountry"
  | "nextDestinationCompanyContact"
  | "nextDestinationCompanyPhone"
  | "nextDestinationCompanyMail"
>;

type TempStorageInfo = Pick<
  Prisma.TemporaryStorageDetailCreateInput,
  | "tempStorerQuantityType"
  | "tempStorerQuantityReceived"
  | "tempStorerWasteAcceptationStatus"
  | "tempStorerWasteRefusalReason"
  | "tempStorerReceivedAt"
  | "tempStorerReceivedBy"
  | "tempStorerSignedAt"
>;

type DestinationAfterTempStorage = Pick<
  Prisma.TemporaryStorageDetailCreateInput,
  | "destinationCompanyName"
  | "destinationCompanySiret"
  | "destinationCompanyAddress"
  | "destinationCompanyContact"
  | "destinationCompanyPhone"
  | "destinationCompanyMail"
  | "destinationCap"
  | "destinationProcessingOperation"
>;

type TransporterAfterTempStorage = Pick<
  Prisma.TemporaryStorageDetailCreateInput,
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "transporterIsExemptedOfReceipt"
  | "transporterReceipt"
  | "transporterDepartment"
  | "transporterValidityLimit"
  | "transporterNumberPlate"
>;

type WasteRepackaging = Pick<
  Prisma.TemporaryStorageDetailCreateInput,
  | "wasteDetailsOnuCode"
  | "wasteDetailsPackagings"
  | "wasteDetailsOtherPackaging"
  | "wasteDetailsNumberOfPackages"
  | "wasteDetailsQuantity"
  | "wasteDetailsQuantityType"
>;

// *********************
// COMMON ERROR MESSAGES
// *********************

export const MISSING_COMPANY_NAME = "Le nom de l'entreprise est obligatoire";
export const MISSING_COMPANY_SIRET = "Le siret de l'entreprise est obligatoire";
export const MISSING_COMPANY_ADDRESS =
  "L'adresse de l'entreprise est obligatoire";
export const MISSING_COMPANY_CONTACT =
  "Le contact dans l'entreprise est obligatoire";
export const MISSING_COMPANY_PHONE =
  "Le téléphone de l'entreprise est obligatoire";
export const MISSING_COMPANY_EMAIL = "L'email de l'entreprise est obligatoire";

export const INVALID_SIRET_LENGTH =
  "Le SIRET doit faire 14 caractères numériques";

export const INVALID_PROCESSING_OPERATION =
  "Cette opération d’élimination / valorisation n'existe pas.";

export const INVALID_WASTE_CODE =
  "Le code déchet n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement.";

export const EXTRANEOUS_NEXT_DESTINATION = `L'opération de traitement renseignée ne permet pas de destination ultérieure`;

// *************************************************************
// DEFINES VALIDATION SCHEMA FOR INDIVIDUAL FRAMES IN BSD PAGE 1
// *************************************************************

// 1 - Émetteur du bordereau
const emitterSchemaFn: FactorySchemaOf<boolean, Emitter> = isDraft =>
  yup.object({
    emitterPickupSite: yup.string().nullable(),
    emitterWorkSiteAddress: yup.string().nullable(),
    emitterWorkSiteCity: yup.string().nullable(),
    emitterWorkSiteInfos: yup.string().nullable(),
    emitterWorkSiteName: yup.string().nullable(),
    emitterWorkSitePostalCode: yup.string().nullable(),
    emitterType: yup.mixed<EmitterType>().when("ecoOrganismeSiret", {
      is: ecoOrganismeSiret => !ecoOrganismeSiret,
      then: yup
        .mixed()
        .requiredIf(!isDraft, `Émetteur: Le type d'émetteur est obligatoire`),
      otherwise: yup
        .mixed()
        .oneOf(
          ["OTHER"],
          `Émetteur: Le type d'émetteur doit être "OTHER" lorsqu'un éco-organisme est responsable du déchet`
        )
    }),
    emitterCompanyName: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_NAME}`),
    emitterCompanySiret: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_SIRET}`)
      .matches(/^$|^\d{14}$/, {
        message: `Émetteur: ${INVALID_SIRET_LENGTH}`
      }),
    emitterCompanyAddress: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_ADDRESS}`),
    emitterCompanyContact: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_CONTACT}`),
    emitterCompanyPhone: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_PHONE}`),
    emitterCompanyMail: yup
      .string()
      .email()
      .ensure()
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_EMAIL}`)
  });

// Optional validation schema for eco-organisme appearing in frame 1
export const ecoOrganismeSchema = yup.object().shape({
  ecoOrganismeSiret: yup
    .string()
    .notRequired()
    .nullable()
    .test(
      "is-known-eco-organisme",
      "L'éco-organisme avec le siret \"${value}\" n'est pas reconnu.",
      ecoOrganismeSiret =>
        ecoOrganismeSiret
          ? prisma.ecoOrganisme
              .findFirst({
                where: { siret: ecoOrganismeSiret }
              })
              .then(el => el != null)
          : true
    ),
  ecoOrganismeName: yup.string().notRequired().nullable()
});

// 2 - Installation de destination ou d’entreposage ou de reconditionnement prévue
const recipientSchemaFn: FactorySchemaOf<boolean, Recipient> = isDraft =>
  yup.object({
    recipientCap: yup
      .string()
      .nullable()
      .test(
        "required-when-dangerous",
        "Le champ CAP est obligatoire pour les déchets dangereux",
        (value, testContext) => {
          const rootValue = testContext.parent;

          if (
            !isDraft &&
            isDangerous(rootValue?.wasteDetailsCode ?? "") &&
            !value
          ) {
            return false;
          }
          return true;
        }
      ),
    recipientIsTempStorage: yup.boolean().nullable(),
    recipientProcessingOperation: yup
      .string()
      .label("Opération d’élimination / valorisation")
      .ensure()
      .requiredIf(!isDraft),
    recipientCompanyName: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_NAME}`),
    recipientCompanySiret: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_SIRET}`)
      .matches(/^$|^\d{14}$/, {
        message: `Destinataire: ${INVALID_SIRET_LENGTH}`
      }),
    recipientCompanyAddress: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_ADDRESS}`),
    recipientCompanyContact: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_CONTACT}`),
    recipientCompanyPhone: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_PHONE}`),
    recipientCompanyMail: yup
      .string()
      .email()
      .ensure()
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_EMAIL}`)
  });

const packagingInfoFn = (isDraft: boolean) =>
  yup.object().shape({
    type: yup
      .mixed<Packagings>()
      .required("Le type de conditionnement doit être précisé."),
    other: yup
      .string()
      .when("type", (type, schema) =>
        type === "AUTRE"
          ? schema.requiredIf(
              !isDraft,
              "La description doit être précisée pour le conditionnement 'AUTRE'."
            )
          : schema
              .nullable()
              .max(
                0,
                "${path} ne peut être renseigné que lorsque le type de conditionnement est 'AUTRE'."
              )
      ),
    quantity: yup
      .number()
      .requiredIf(
        !isDraft,
        "Le nombre de colis associé au conditionnement doit être précisé."
      )
      .integer()
      .min(1, "Le nombre de colis doit être supérieur à 0.")
      .when("type", (type, schema) =>
        ["CITERNE", "BENNE"].includes(type)
          ? schema.max(
              2,
              "Le nombre de benne ou de citerne ne peut être supérieur à 2."
            )
          : schema
      )
  });

// 3 - Dénomination du déchet
// 4 - Mentions au titre des règlements ADR, RID, ADNR, IMDG
// 5 - Conditionnement
// 6 - Quantité
const wasteDetailsSchemaFn: FactorySchemaOf<boolean, WasteDetails> = isDraft =>
  yup.object({
    wasteDetailsNumberOfPackages: yup.number().nullable(),
    wasteDetailsOtherPackaging: yup.string().nullable(),
    wasteDetailsPackagings: yup.object().nullable(),
    wasteDetailsName: yup.string().nullable(),
    wasteDetailsCode: yup
      .string()
      .requiredIf(!isDraft, "Le code déchet est obligatoire")
      .oneOf([...WASTES_CODES, "", null], INVALID_WASTE_CODE),
    wasteDetailsOnuCode: yup.string().when("wasteDetailsCode", {
      is: (wasteCode: string) => isDangerous(wasteCode || ""),
      then: () =>
        yup
          .string()
          .ensure()
          .requiredIf(
            !isDraft,
            `La mention ADR est obligatoire pour les déchets dangereux. Merci d'indiquer "non soumis" si nécessaire.`
          ),
      otherwise: () => yup.string().nullable()
    }),
    wasteDetailsPackagingInfos: yup
      .array()
      .requiredIf(!isDraft, "Le détail du conditionnement est obligatoire")
      .of(packagingInfoFn(isDraft))
      .test(
        "is-valid-packaging-infos",
        "${path} ne peut pas à la fois contenir 1 citerne ou 1 benne et un autre conditionnement.",
        (infos: PackagingInfo[]) => {
          const hasCiterne = infos?.find(i => i.type === "CITERNE");
          const hasBenne = infos?.find(i => i.type === "BENNE");

          if (hasCiterne && hasBenne) {
            return false;
          }

          const hasOtherPackaging = infos?.find(
            i => !["CITERNE", "BENNE"].includes(i.type)
          );
          if ((hasCiterne || hasBenne) && hasOtherPackaging) {
            return false;
          }

          return true;
        }
      ),
    wasteDetailsQuantity: yup
      .number()
      .requiredIf(!isDraft, "La quantité du déchet en tonnes est obligatoire")
      .min(0, "La quantité doit être supérieure à 0"),
    wasteDetailsQuantityType: yup
      .mixed<QuantityType>()
      .requiredIf(
        !isDraft,
        "Le type de quantité (réelle ou estimée) doit être précisé"
      ),
    wasteDetailsConsistence: yup
      .mixed<Consistence>()
      .requiredIf(!isDraft, "La consistance du déchet doit être précisée"),
    wasteDetailsPop: yup
      .boolean()
      .requiredIf(!isDraft, "La présence (ou non) de POP doit être précisée")
  });

export const wasteDetailsSchema = wasteDetailsSchemaFn(false);

export const beforeSignedByTransporterSchema: yup.SchemaOf<Pick<
  Form,
  "wasteDetailsPackagingInfos"
>> = yup.object({
  wasteDetailsPackagingInfos: yup
    .array()
    .min(1, "Le nombre de contenants doit être supérieur à 0")
});

// 8 - Collecteur-transporteur
const transporterSchemaFn: FactorySchemaOf<boolean, Transporter> = isDraft =>
  yup.object({
    transporterCustomInfo: yup.string().nullable(),
    transporterNumberPlate: yup.string().nullable(),
    transporterCompanyName: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Transporteur: ${MISSING_COMPANY_NAME}`),
    transporterCompanySiret: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Transporteur: ${MISSING_COMPANY_SIRET}`)
      .matches(/^$|^\d{14}$/, {
        message: `Transporteur: ${INVALID_SIRET_LENGTH}`
      }),
    transporterCompanyAddress: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Transporteur: ${MISSING_COMPANY_ADDRESS}`),
    transporterCompanyContact: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Transporteur: ${MISSING_COMPANY_CONTACT}`),
    transporterCompanyPhone: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Transporteur: ${MISSING_COMPANY_PHONE}`),
    transporterCompanyMail: yup
      .string()
      .email()
      .ensure()
      .requiredIf(!isDraft, `Transporteur: ${MISSING_COMPANY_EMAIL}`),
    transporterIsExemptedOfReceipt: yup.boolean().notRequired().nullable(),
    transporterReceipt: yup
      .string()
      .when("transporterIsExemptedOfReceipt", (isExemptedOfReceipt, schema) =>
        isExemptedOfReceipt
          ? schema.notRequired().nullable()
          : schema
              .ensure()
              .requiredIf(
                !isDraft,
                "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
              )
      ),
    transporterDepartment: yup
      .string()
      .when("transporterIsExemptedOfReceipt", (isExemptedOfReceipt, schema) =>
        isExemptedOfReceipt
          ? schema.notRequired().nullable()
          : schema
              .ensure()
              .requiredIf(
                !isDraft,
                "Le département du transporteur est obligatoire"
              )
      ),
    transporterValidityLimit: yup.date().nullable()
  });

// 8 - Collecteur-transporteur
// 9 - Déclaration générale de l’émetteur du bordereau :
export const signingInfoSchema: yup.SchemaOf<SigningInfo> = yup.object({
  signedByTransporter: yup.boolean().nullable(),
  sentAt: yup.date().required(),
  sentBy: yup
    .string()
    .ensure()
    .required("Le nom de l'émetteur du bordereau est obligatoire")
});

// 10 - Expédition reçue à l’installation de destination
export const receivedInfoSchema: yup.SchemaOf<ReceivedInfo> = yup.object({
  isAccepted: yup.boolean(),
  receivedBy: yup
    .string()
    .ensure()
    .required("Vous devez saisir un responsable de la réception."),
  receivedAt: yup.date().required(),
  signedAt: yup.date().nullable(),
  quantityReceived: yup
    .number()
    // if waste is refused, quantityReceived must be 0
    .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
      ["REFUSED"].includes(wasteAcceptationStatus)
        ? schema.test(
            "is-zero",
            "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé",
            v => v === 0
          )
        : schema
    )
    // if waste is partially or totally accepted, we check it is a positive value
    .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
      ["ACCEPTED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
        ? schema.test(
            "is-strictly-positive",
            "Vous devez saisir une quantité reçue supérieure à 0.",
            v => v > 0
          )
        : schema
    ),
  wasteAcceptationStatus: yup.mixed<WasteAcceptationStatus>(),
  wasteRefusalReason: yup
    .string()
    .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
      ["REFUSED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
        ? schema.ensure().required("Vous devez saisir un motif de refus")
        : schema
            .notRequired()
            .nullable()
            .test(
              "is-empty",
              "Le champ wasteRefusalReason ne doit pas être rensigné si le déchet est accepté ",
              v => !v
            )
    )
});

// 10 - Expédition acceptée (ou refusée) à l’installation de destination
export const acceptedInfoSchema: yup.SchemaOf<AcceptedInfo> = yup.object({
  isAccepted: yup.boolean(),
  signedAt: yup.date().nullable(),
  signedBy: yup
    .string()
    .ensure()
    .required("Vous devez saisir un responsable de la réception."),
  quantityReceived: yup
    .number()
    .required()
    // if waste is refused, quantityReceived must be 0
    .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
      ["REFUSED"].includes(wasteAcceptationStatus)
        ? schema.test(
            "is-zero",
            "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé",
            v => v === 0
          )
        : schema
    )
    // if waste is partially or totally accepted, we check it is a positive value
    .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
      ["ACCEPTED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
        ? schema.test(
            "is-strictly-positive",
            "Vous devez saisir une quantité reçue supérieure à 0.",
            v => v > 0
          )
        : schema
    ),
  wasteAcceptationStatus: yup.mixed<WasteAcceptationStatus>().required(),
  wasteRefusalReason: yup
    .string()
    .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
      ["REFUSED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
        ? schema.ensure().required("Vous devez saisir un motif de refus")
        : schema
            .notRequired()
            .nullable()
            .test(
              "is-empty",
              "Le champ wasteRefusalReason ne doit pas être rensigné si le déchet est accepté ",
              v => !v
            )
    )
});

const withNextDestination = yup.object().shape({
  nextDestinationProcessingOperation: yup
    .string()
    .oneOf(
      PROCESSING_OPERATIONS_CODES,
      `Destination ultérieure: ${INVALID_PROCESSING_OPERATION}`
    ),
  nextDestinationCompanyName: yup
    .string()
    .ensure()
    .required(`Destination ultérieure: ${MISSING_COMPANY_NAME}`),
  nextDestinationCompanySiret: yup
    .string()
    .when("nextDestinationCompanyCountry", (country, schema) => {
      return country == null || country === "FR"
        ? schema
            .ensure()
            .required(`Destination ultérieure prévue: ${MISSING_COMPANY_SIRET}`)
            .length(
              14,
              `Destination ultérieure prévue: ${INVALID_SIRET_LENGTH}`
            )
        : schema.notRequired().nullable();
    }),
  nextDestinationCompanyAddress: yup
    .string()
    .ensure()
    .required(`Destination ultérieure: ${MISSING_COMPANY_ADDRESS}`),
  nextDestinationCompanyCountry: yup.string().oneOf(
    countries.map(country => country.cca2),
    "Destination ultérieure: le code ISO 3166-1 alpha-2 du pays de l'entreprise n'est pas reconnu"
  ),
  nextDestinationCompanyContact: yup
    .string()
    .ensure()
    .required(`Destination ultérieure: ${MISSING_COMPANY_CONTACT}`),
  nextDestinationCompanyPhone: yup
    .string()
    .ensure()
    .required(`Destination ultérieure: ${MISSING_COMPANY_PHONE}`),
  nextDestinationCompanyMail: yup
    .string()
    .email()
    .ensure()
    .required(`Destination ultérieure: ${MISSING_COMPANY_EMAIL}`)
});
const withoutNextDestination = yup.object().shape({
  nextDestinationProcessingOperation: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  nextDestinationCompanyName: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  nextDestinationCompanySiret: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  nextDestinationCompanyAddress: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  nextDestinationCompanyCountry: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  nextDestinationCompanyContact: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  nextDestinationCompanyPhone: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  nextDestinationCompanyMail: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION)
});

const traceabilityBreakAllowed = yup.object({
  noTraceability: yup.boolean().nullable()
});

const traceabilityBreakForbidden = yup.object({
  noTraceability: yup
    .boolean()
    .nullable()
    .notOneOf(
      [true],
      "Vous ne pouvez pas indiquer une rupture de traçabilité avec un code de traitement final"
    )
});

// 11 - Réalisation de l’opération :
const processedInfoSchemaFn: (
  value: any
) => yup.SchemaOf<ProcessedInfo> = value => {
  const base = yup.object({
    processedBy: yup
      .string()
      .ensure()
      .required("Vous devez saisir un responsable de traitement."),
    processedAt: yup.date().required(),
    processingOperationDone: yup
      .string()
      .oneOf(PROCESSING_OPERATIONS_CODES, INVALID_PROCESSING_OPERATION),
    processingOperationDescription: yup.string().nullable()
  });

  return PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(
    value?.processingOperationDone
  )
    ? base.concat(withNextDestination).concat(traceabilityBreakAllowed)
    : base.concat(withoutNextDestination).concat(traceabilityBreakForbidden);
};

export const processedInfoSchema = yup.lazy(processedInfoSchemaFn);

// *********************************************************************
// DEFINES VALIDATION SCHEMA FOR INDIVIDUAL FRAMES IN BSD PAGE 2 (SUITE)
// *********************************************************************

// 13 - Réception dans l’installation d’entreposage ou de reconditionnement
export const tempStoredInfoSchema: yup.SchemaOf<TempStorageInfo> = yup.object({
  tempStorerReceivedBy: yup
    .string()
    .ensure()
    .required("Vous devez saisir un responsable de la réception."),
  tempStorerReceivedAt: yup.date().required(),
  tempStorerSignedAt: yup.date().nullable(),
  tempStorerQuantityType: yup.mixed<QuantityType>(),
  tempStorerWasteAcceptationStatus: yup.mixed<WasteAcceptationStatus>(),
  tempStorerQuantityReceived: yup
    .number()
    // if waste is refused, quantityReceived must be 0
    .when(
      "tempStorerWasteAcceptationStatus",
      (wasteAcceptationStatus, schema) =>
        ["REFUSED"].includes(wasteAcceptationStatus)
          ? schema.test(
              "is-zero",
              "Vous devez saisir une quantité reçue égale à 0.",
              v => v === 0
            )
          : schema
    )
    // if waste is partially or totally accepted, we check it is a positive value
    .when(
      "tempStorerWasteAcceptationStatus",
      (wasteAcceptationStatus, schema) =>
        ["ACCEPTED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
          ? schema.test(
              "is-strictly-positive",
              "Vous devez saisir une quantité reçue supérieure à 0.",
              v => v > 0
            )
          : schema
    ),
  tempStorerWasteRefusalReason: yup
    .string()
    .when(
      "tempStorerWasteAcceptationStatus",
      (wasteAcceptationStatus, schema) =>
        ["REFUSED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
          ? schema.required("Vous devez renseigner la raison du refus")
          : schema
              .notRequired()
              .nullable()
              .test(
                "is-empty",
                "Le champ tempStorerWasteRefusalReason ne doit pas être rensigné si le déchet est accepté ",
                v => !v
              )
    )
});

export const tempStorerAcceptedInfoSchema = yup.object().shape({
  tempStorerReceivedAt: yup.date().nullable(),
  tempStorerQuantityType: yup.mixed<QuantityType>().required(),
  tempStorerWasteAcceptationStatus: yup
    .mixed<WasteAcceptationStatus>()
    .required(),
  tempStorerSignedBy: yup
    .string()
    .ensure()
    .required("Vous devez saisir un responsable de l'acceptation."),
  tempStorerSignedAt: yup.date().nullable(),
  tempStorerQuantityReceived: yup
    .number()
    .required()
    // if waste is refused, quantityReceived must be 0
    .when(
      "tempStorerWasteAcceptationStatus",
      (wasteAcceptationStatus, schema) =>
        ["REFUSED"].includes(wasteAcceptationStatus)
          ? schema.test(
              "is-zero",
              "Vous devez saisir une quantité reçue égale à 0.",
              v => v === 0
            )
          : schema
    )
    // if waste is partially or totally accepted, we check it is a positive value
    .when(
      "tempStorerWasteAcceptationStatus",
      (wasteAcceptationStatus, schema) =>
        ["ACCEPTED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
          ? schema.test(
              "is-strictly-positive",
              "Vous devez saisir une quantité reçue supérieure à 0.",
              v => v > 0
            )
          : schema
    ),
  tempStorerWasteRefusalReason: yup
    .string()
    .when(
      "tempStorerWasteAcceptationStatus",
      (wasteAcceptationStatus, schema) =>
        ["REFUSED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
          ? schema.required("Vous devez renseigner la raison du refus")
          : schema
              .notRequired()
              .nullable()
              .test(
                "is-empty",
                "Le champ tempStorerWasteRefusalReason ne doit pas être rensigné si le déchet est accepté ",
                v => !v
              )
    )
});

// 14 - Installation de destination prévue
export const destinationAfterTempStorageSchema: yup.SchemaOf<DestinationAfterTempStorage> = yup.object(
  {
    destinationCap: yup.string().nullable(),
    destinationCompanyName: yup
      .string()
      .ensure()
      .required(`Destination prévue: ${MISSING_COMPANY_NAME}`),
    destinationCompanySiret: yup
      .string()
      .ensure()
      .required(`Destination prévue: ${MISSING_COMPANY_SIRET}`)
      .length(14, `Destination ultérieure: ${INVALID_SIRET_LENGTH}`),
    destinationCompanyAddress: yup
      .string()
      .ensure()
      .required(`Destination prévue: ${MISSING_COMPANY_ADDRESS}`),
    destinationCompanyContact: yup
      .string()
      .ensure()
      .required(`Destination prévue: ${MISSING_COMPANY_CONTACT}`),
    destinationCompanyPhone: yup
      .string()
      .ensure()
      .required(`Destination prévue: ${MISSING_COMPANY_PHONE}`),
    destinationCompanyMail: yup
      .string()
      .ensure()
      .required(`Destination prévue: ${MISSING_COMPANY_EMAIL}`),
    destinationProcessingOperation: yup
      .string()
      .oneOf(PROCESSING_OPERATIONS_CODES, INVALID_PROCESSING_OPERATION)
  }
);

// 15 - Mentions au titre des règlements ADR, RID, ADNR, IMDG
// 16 - Conditionnement
// 17 - Quantité
export const wasteRepackagingSchema: yup.SchemaOf<WasteRepackaging> = yup.object(
  {
    wasteDetailsOnuCode: yup.string().nullable(),
    wasteDetailsOtherPackaging: yup.string().nullable(),
    wasteDetailsPackagings: yup.object().nullable(),
    wasteDetailsQuantityType: yup.mixed<QuantityType>().nullable(),
    wasteDetailsNumberOfPackages: yup
      .number()
      .nullable()
      .notRequired()
      .integer()
      .min(1, "Le nombre de colis doit être supérieur à 0"),
    wasteDetailsQuantity: yup
      .number()
      .nullable()
      .notRequired()
      .min(0, "La quantité doit être supérieure à 0")
  }
);

// 18 - Collecteur-transporteur reconditionnement
export const transporterAfterTempStorageSchema: yup.SchemaOf<TransporterAfterTempStorage> = transporterSchemaFn(
  false
);

// *******************************************************************
// COMPOSE VALIDATION SCHEMAS TO VALIDATE A FORM FOR A SPECIFIC STATUS
// *******************************************************************

// validation schema for BSD before it can be sealed
const baseFormSchemaFn = (isDraft: boolean) =>
  emitterSchemaFn(isDraft)
    .concat(ecoOrganismeSchema)
    .concat(recipientSchemaFn(isDraft))
    .concat(wasteDetailsSchemaFn(isDraft))
    .concat(transporterSchemaFn(isDraft));

export const sealedFormSchema = baseFormSchemaFn(false);
export const draftFormSchema = baseFormSchemaFn(true);

// validation schema for a BSD with a processed status
export const processedFormSchema = yup.lazy((value: any) =>
  sealedFormSchema
    .concat(signingInfoSchema)
    .concat(receivedInfoSchema)
    .concat(processedInfoSchemaFn(value))
);

// validation schema for BSD suite before it can be (re)sealed
export const resealedFormSchema = tempStoredInfoSchema
  .concat(destinationAfterTempStorageSchema)
  .concat(wasteRepackagingSchema)
  .concat(transporterAfterTempStorageSchema);

// *******************************************************************
// HELPER FUNCTIONS THAT MAKE USES OF YUP SCHEMAS TO APPLY VALIDATION
// *******************************************************************

export async function checkCanBeSealed(form: Form) {
  try {
    const validForm = await sealedFormSchema.validate(form, {
      abortEarly: false
    });
    return validForm;
  } catch (err) {
    if (err.name === "ValidationError") {
      const stringifiedErrors = err.errors?.join("\n");
      throw new UserInputError(
        `Erreur, impossible de valider le bordereau car des champs obligatoires ne sont pas renseignés.\nErreur(s): ${stringifiedErrors}`
      );
    } else {
      throw err;
    }
  }
}

/**
 * Check company in frame 2 is verified and registered with profile
 * COLLECTOR or WASTE_PROCESSOR or throw error
 */
async function checkDestination(siret: string) {
  // check company is registered in Trackdechets
  const company = await prisma.company.findUnique({
    where: { siret }
  });

  if (!company) {
    throw new UserInputError(
      `L'installation de destination ou d’entreposage ou de reconditionnement qui a été renseignée en case 2 (SIRET: ${siret}) n'est pas inscrite sur Trackdéchets`
    );
  }

  // check company has profile COLLECTOR or WASTE_PROCESSOR
  if (!(isCollector(company) || isWasteProcessor(company))) {
    throw new UserInputError(
      `L'installation de destination ou d’entreposage ou de reconditionnement qui a été renseignée en case 2 (SIRET: ${company.siret})
      n'est pas inscrite sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement.
      Cette installation ne peut donc pas être visée en case 2 du bordereau. Veuillez vous rapprocher de l'administrateur
      de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
    );
  }

  if (
    VERIFY_COMPANY === "true" &&
    company.verificationStatus !== CompanyVerificationStatus.VERIFIED
  ) {
    throw new UserInputError(
      `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue ${company.siret}
      n'a pas encore été vérifié. Cette installation ne peut pas être visée en case 2 du bordereau.`
    );
  }

  return true;
}

/**
 * Check company in frame 2 is verified and registered with profile
 * COLLECTOR or WASTE_PROCESSOR or throw error
 */
async function checkDestinationAfterTempStorage(siret: string) {
  // check company in frame 14 is registered in Trackdechets
  const company = await prisma.company.findUnique({
    where: { siret }
  });

  if (!company) {
    throw new UserInputError(
      `L'installation de destination après entreposage provisoire ou reconditionnement qui a été renseignée en case 14 (SIRET ${siret}) n'est pas inscrite sur Trackdéchets`
    );
  }

  // check company has profile COLLECTOR or WASTE_PROCESSOR
  if (!(isCollector(company) || isWasteProcessor(company))) {
    throw new UserInputError(
      `L'installation de destination après entreposage provisoire ou reconditionnement qui a été renseignée en case 14 (SIRET ${company.siret})
      n'est pas inscrite sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement.
      Cette installation ne peut donc pas être visée en case 14 du bordereau. Veuillez vous rapprocher de l'administrateur
      de cette installation pour qu'il modifie le profil de l'installation depuis l'interface Trackdéchets Mon Compte > Établissements`
    );
  }

  if (
    VERIFY_COMPANY === "true" &&
    company.verificationStatus !== CompanyVerificationStatus.VERIFIED
  ) {
    throw new UserInputError(
      `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue ${company.siret}
      n'a pas encore été vérifié. Cette installation ne peut pas être visée en case 14 du bordereau.`
    );
  }

  return true;
}

/**
 * Check that the n°SIRET appearing on the form match existing
 * companies registered in Trackdechets and that their profile
 * is consistent with the role they play on the form
 * (producer, trader, destination, etc)
 *
 * For the time beeing we are only checking companies in frame 2 and 14
 * (if any). They should be registered as COLLECTOR (TTR) or WASTEPROCESSOR
 */
export async function checkCompaniesType(form: Form) {
  await checkDestination(form.recipientCompanySiret);

  const temporaryStorageDetail = await prisma.form
    .findUnique({ where: { id: form.id } })
    .temporaryStorageDetail();

  if (
    temporaryStorageDetail &&
    temporaryStorageDetail.destinationCompanySiret
  ) {
    await checkDestinationAfterTempStorage(
      temporaryStorageDetail.destinationCompanySiret
    );
  }

  return true;
}

/**
 * @param appendix2Forms bordereaux annexés
 * @param form bordereau de regroupement existant
 */
export async function validateAppendix2Forms(
  appendix2FormsInput: AppendixFormInput[],
  form?: Partial<Pick<Form, "id" | "emitterCompanySiret">>
) {
  const appendix2Forms = await Promise.all(
    appendix2FormsInput.map(({ id }) => getFormOrFormNotFound({ id }))
  );

  for (const appendix2 of appendix2Forms) {
    if (appendix2.appendix2RootFormId) {
      if (
        !form?.id ||
        (form?.id && appendix2.appendix2RootFormId !== form.id)
      ) {
        // the form has already been grouped into another one
        throw new FormAlreadyInAppendix2(appendix2.id);
      }
    } else {
      if (appendix2.status !== Status.AWAITING_GROUP) {
        throw new UserInputError(
          `Le bordereau ${appendix2.id} n'est pas en attente de regroupement`
        );
      }
    }
    const appendix2DestinationSiret = await getFinalDestinationSiret(appendix2);

    if (form?.emitterCompanySiret !== appendix2DestinationSiret) {
      throw new UserInputError(
        `Le bordereau ${appendix2.id} n'est pas en possession du nouvel émetteur`
      );
    }
  }

  return appendix2Forms;
}
