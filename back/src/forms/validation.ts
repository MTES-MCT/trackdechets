import * as yup from "yup";
import validDatetime from "../common/yup/validDatetime";
import configureYup from "../common/yup/configureYup";
import {
  Form,
  EmitterType,
  QuantityType,
  Consistence,
  WasteAcceptationStatus,
  TemporaryStorageDetail,
  prisma
} from "../generated/prisma-client";
import {
  WASTES_CODES,
  PROCESSING_OPERATIONS_CODES,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES,
  isDangerous
} from "../common/constants";
import { UserInputError } from "apollo-server-express";
import countries from "world-countries";

// set yup default error messages
configureYup();

// ************************************************
// BREAK DOWN FORM TYPE INTO INDIVIDUAL FRAME TYPES
// ************************************************

type Emitter = Pick<
  Form,
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
  Form,
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
  Form,
  | "wasteDetailsCode"
  | "wasteDetailsName"
  | "wasteDetailsOnuCode"
  | "wasteDetailsPackagings"
  | "wasteDetailsOtherPackaging"
  | "wasteDetailsNumberOfPackages"
  | "wasteDetailsQuantity"
  | "wasteDetailsQuantityType"
  | "wasteDetailsConsistence"
>;

type Transporter = Pick<
  Form,
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
  | "sentAt"
  | "signedByTransporter"
>;

type ReceivedInfo = Pick<
  Form,
  | "isAccepted"
  | "wasteAcceptationStatus"
  | "wasteRefusalReason"
  | "receivedBy"
  | "receivedAt"
  | "signedAt"
  | "quantityReceived"
>;

type SigningInfo = Pick<Form, "sentAt" | "sentBy" | "signedByTransporter">;

type ProcessedInfo = Pick<
  Form,
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
  TemporaryStorageDetail,
  | "tempStorerQuantityType"
  | "tempStorerQuantityReceived"
  | "tempStorerWasteAcceptationStatus"
  | "tempStorerWasteRefusalReason"
  | "tempStorerReceivedAt"
  | "tempStorerReceivedBy"
  | "tempStorerSignedAt"
>;

type DestinationAfterTempStorage = Pick<
  TemporaryStorageDetail,
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
  TemporaryStorageDetail,
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
  Form,
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

const MISSING_COMPANY_NAME = "Le nom de l'entreprise est obligatoire";
const MISSING_COMPANY_SIRET = "Le siret de l'entreprise est obligatoire";
const MISSING_COMPANY_ADDRESS = "L'adresse de l'entreprise est obligatoire";
const MISSING_COMPANY_CONTACT = "Le contact dans l'entreprise est obligatoire";
const MISSING_COMPANY_PHONE = "Le téléphone de l'entreprise est obligatoire";
const MISSING_COMPANY_EMAIL = "L'email de l'entreprise est obligatoire";

const INVALID_SIRET_LENGTH = "Le SIRET doit faire 14 caractères numériques";

const INVALID_PROCESSING_OPERATION =
  "Cette opération d’élimination / valorisation n'existe pas.";

const INVALID_WASTE_CODE =
  "Le code déchet n'est pas reconnu comme faisant partie de la liste officielle du code de l'environnement.";

const EXTRANEOUS_NEXT_DESTINATION = `L'opération de traitement renseignée ne permet pas de destination ultérieure`;

// *************************************************************
// DEFINES VALIDATION SCHEMA FOR INDIVIDUAL FRAMES IN BSD PAGE 1
// *************************************************************

// 1 - Émetteur du bordereau
export const emitterSchema: yup.ObjectSchema<Emitter> = yup.object().shape({
  emitterType: yup.mixed<EmitterType>().required(),
  emitterCompanyName: yup
    .string()
    .ensure()
    .required(`Émetteur: ${MISSING_COMPANY_NAME}`),
  emitterCompanySiret: yup
    .string()
    .ensure()
    .required(`Émetteur: ${MISSING_COMPANY_SIRET}`)
    .length(14, `Émetteur: ${INVALID_SIRET_LENGTH}`),
  emitterCompanyAddress: yup
    .string()
    .ensure()
    .required(`Émetteur: ${MISSING_COMPANY_ADDRESS}`),
  emitterCompanyContact: yup
    .string()
    .ensure()
    .required(`Émetteur: ${MISSING_COMPANY_CONTACT}`),
  emitterCompanyPhone: yup
    .string()
    .ensure()
    .required(`Émetteur: ${MISSING_COMPANY_PHONE}`),
  emitterCompanyMail: yup
    .string()
    .email()
    .ensure()
    .required(`Émetteur: ${MISSING_COMPANY_EMAIL}`)
});

// Optional validation schema for eco-organisme appearing in frame 1
// This schema should only be used in conjunction with emitterSchema
// on a form where we retrieved linked objet ecoOrganisme
// prisma.form({ id }).ecoOrganisme()
export const ecoOrganismeSchema = yup.object().shape({
  ecoOrganisme: yup
    .object()
    .notRequired()
    .nullable()
    .when("emitterType", (emitterType, schema) =>
      emitterType === "OTHER"
        ? schema
        : schema.test(
            "is-not-set",
            "${path} ne peut avoir une valeur que si l'émetteur est de type `Autre détenteur`",
            value => value == null
          )
    )
});

// 2 - Installation de destination ou d’entreposage ou de reconditionnement prévue
export const recipientSchema: yup.ObjectSchema<Recipient> = yup.object().shape({
  recipientProcessingOperation: yup
    .string()
    .label("Opération d’élimination / valorisation")
    .ensure()
    .required(),
  recipientCompanyName: yup
    .string()
    .ensure()
    .required(`Destinataire: ${MISSING_COMPANY_NAME}`),
  recipientCompanySiret: yup
    .string()
    .ensure()
    .required(`Destinataire: ${MISSING_COMPANY_SIRET}`)
    .length(14, `Destinataire: ${INVALID_SIRET_LENGTH}`),
  recipientCompanyAddress: yup
    .string()
    .ensure()
    .required(`Destinataire: ${MISSING_COMPANY_ADDRESS}`),
  recipientCompanyContact: yup
    .string()
    .ensure()
    .required(`Destinataire: ${MISSING_COMPANY_CONTACT}`),
  recipientCompanyPhone: yup
    .string()
    .ensure()
    .required(`Destinataire: ${MISSING_COMPANY_PHONE}`),
  recipientCompanyMail: yup
    .string()
    .email()
    .ensure()
    .required(`Destinataire: ${MISSING_COMPANY_EMAIL}`)
});

// 3 - Dénomination du déchet
// 4 - Mentions au titre des règlements ADR, RID, ADNR, IMDG
// 5 - Conditionnement
// 6 - Quantité
export const wasteDetailsSchema: yup.ObjectSchema<WasteDetails> = yup
  .object()
  .shape({
    wasteDetailsCode: yup
      .string()
      .ensure()
      .required("Le code déchet est obligatoire")
      .oneOf(WASTES_CODES, INVALID_WASTE_CODE),
    wasteDetailsOnuCode: yup.string().when("wasteDetailsCode", {
      is: (wasteCode: string) => isDangerous(wasteCode || ""),
      then: () =>
        yup
          .string()
          .ensure()
          .required(
            `La mention ADR est obligatoire pour les déchets dangereux. Merci d'indiquer "non soumis" si nécessaire.`
          ),
      otherwise: () => yup.string().nullable(),
      wasteDetailsPackagings: yup.array().ensure().required(),
      wasteDetailsNumberOfPackages: yup
        .number()
        .integer()
        .min(1, "Le nombre de colis doit être supérieur à 0")
        .nullable(true),
      wasteDetailsQuantity: yup
        .number()
        .required("La quantité du déchet en tonnes est obligatoire")
        .min(0, "La quantité doit être supérieure à 0"),
      wasteDetailsQuantityType: yup
        .mixed<QuantityType>()
        .required("Le type de quantité (réelle ou estimée) doit être précisé"),
      wasteDetailsConsistence: yup
        .mixed<Consistence>()
        .required("La consistance du déchet doit être précisée")
    })
  });

// 8 - Collecteur-transporteur
export const transporterSchema: yup.ObjectSchema<Transporter> = yup
  .object()
  .shape({
    transporterCompanyName: yup
      .string()
      .ensure()
      .required(`Transporteur: ${MISSING_COMPANY_NAME}`),
    transporterCompanySiret: yup
      .string()
      .ensure()
      .required(`Transporteur: ${MISSING_COMPANY_SIRET}`)
      .length(14, `Transporteur: ${INVALID_SIRET_LENGTH}`),
    transporterCompanyAddress: yup
      .string()
      .ensure()
      .required(`Transporteur: ${MISSING_COMPANY_ADDRESS}`),
    transporterCompanyContact: yup
      .string()
      .ensure()
      .required(`Transporteur: ${MISSING_COMPANY_CONTACT}`),
    transporterCompanyPhone: yup
      .string()
      .ensure()
      .required(`Transporteur: ${MISSING_COMPANY_PHONE}`),
    transporterCompanyMail: yup
      .string()
      .email()
      .ensure()
      .required(`Transporteur: ${MISSING_COMPANY_EMAIL}`),
    transporterIsExemptedOfReceipt: yup.boolean().notRequired().nullable(),
    transporterReceipt: yup
      .string()
      .when("transporterIsExemptedOfReceipt", (isExemptedOfReceipt, schema) =>
        isExemptedOfReceipt
          ? schema.notRequired().nullable()
          : schema
              .ensure()
              .required(
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
              .required("Le département du transporteur est obligatoire")
      ),
    transporterValidityLimit: validDatetime({
      verboseFieldName: "date de validité"
    })
  });

// 8 - Collecteur-transporteur
// 9 - Déclaration générale de l’émetteur du bordereau :
export const signingInfoSchema: yup.ObjectSchema<SigningInfo> = yup
  .object()
  .shape({
    sentAt: validDatetime({
      verboseFieldName: "date d'envoi",
      required: true
    }),
    sentBy: yup
      .string()
      .ensure()
      .required("Le nom de l'émetteur du bordereau est obligatoire")
  });

// 10 - Expédition reçue à l’installation de destination
export const receivedInfoSchema: yup.ObjectSchema<ReceivedInfo> = yup
  .object()
  .shape({
    wasteAcceptationStatus: yup.mixed<WasteAcceptationStatus>().required(),
    receivedBy: yup
      .string()
      .ensure()
      .required("Vous devez saisir un responsable de la réception."),
    receivedAt: validDatetime({
      verboseFieldName: "date de réception",
      required: true
    }),
    signedAt: validDatetime({
      verboseFieldName: "date d'acceptation"
    }),
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

// 11 - Réalisation de l’opération :
export const processedInfoSchema = yup.lazy((value: any) => {
  const base = yup.object().shape({
    processedBy: yup
      .string()
      .ensure()
      .required("Vous devez saisir un responsable de traitement."),
    processedAt: validDatetime({
      verboseFieldName: "date de traitement",
      required: true
    }),
    processingOperationDone: yup
      .string()
      .oneOf(PROCESSING_OPERATIONS_CODES, INVALID_PROCESSING_OPERATION)
  });

  return PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(
    value?.processingOperationDone
  )
    ? base.concat(withNextDestination)
    : base.concat(withoutNextDestination);
});

// *********************************************************************
// DEFINES VALIDATION SCHEMA FOR INDIVIDUAL FRAMES IN BSD PAGE 2 (SUITE)
// *********************************************************************

// 13 - Réception dans l’installation d’entreposage ou de reconditionnement
export const tempStoredInfoSchema: yup.ObjectSchema<TempStorageInfo> = yup
  .object()
  .shape({
    tempStorerQuantityType: yup.mixed<QuantityType>().required(),
    tempStorerWasteAcceptationStatus: yup
      .mixed<WasteAcceptationStatus>()
      .required(),
    tempStorerReceivedBy: yup
      .string()
      .ensure()
      .required("Vous devez saisir un responsable de la réception."),
    tempStorerReceivedAt: validDatetime({
      verboseFieldName: "date de réception",
      required: true
    }),
    tempStorerSignedAt: validDatetime({
      verboseFieldName: "date d'acceptation"
    }),
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
export const destinationAfterTempStorageSchema: yup.ObjectSchema<DestinationAfterTempStorage> = yup
  .object()
  .shape({
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
  });

// 15 - Mentions au titre des règlements ADR, RID, ADNR, IMDG
// 16 - Conditionnement
// 17 - Quantité
export const wasteRepackagingSchema: yup.ObjectSchema<WasteRepackaging> = yup
  .object()
  .shape({
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
  });

// 18 - Collecteur-transporteur reconditionnement
export const transporterAfterTempStorageSchema: yup.ObjectSchema<TransporterAfterTempStorage> = transporterSchema;

// *******************************************************************
// COMPOSE VALIDATION SCHEMAS TO VALIDATE A FORM FOR A SPECIFIC STATUS
// *******************************************************************

// validation schema for a form in draft mode, all fields are nullable
export const draftFormSchema = yup.object().shape({
  emitterCompanySiret: yup
    .string()
    .nullable()
    .notRequired()
    .matches(/^$|^\d{14}$/, {
      message: `Émetteur: ${INVALID_SIRET_LENGTH}`
    }),
  emitterCompanyMail: yup.string().email().nullable().notRequired(),
  recipientCompanySiret: yup
    .string()
    .notRequired()
    .nullable()
    .matches(/^$|^\d{14}$/, {
      message: `Destinataire: ${INVALID_SIRET_LENGTH}`
    }),
  recipientCompanyMail: yup.string().notRequired().nullable().email(),
  wasteDetailsCode: yup
    .string()
    .notRequired()
    .nullable()
    .oneOf([...WASTES_CODES, "", null], INVALID_WASTE_CODE),
  transporterCompanySiret: yup
    .string()
    .notRequired()
    .nullable()
    .matches(/^$|^\d{14}$/, {
      message: `Transporteur: ${INVALID_SIRET_LENGTH}`
    }),
  transporterCompanyMail: yup.string().notRequired().nullable().email(),
  transporterValidityLimit: validDatetime({
    verboseFieldName: "date de validité",
    required: false
  })
});

// validation schema for BSD before it can be sealed
export const sealedFormSchema = emitterSchema
  .concat(recipientSchema)
  .concat(wasteDetailsSchema)
  .concat(transporterSchema);

// validation schema for BSD suite before it can be (re)sealed
export const resealedFormSchema = tempStoredInfoSchema
  .concat(destinationAfterTempStorageSchema)
  .concat(wasteRepackagingSchema)
  .concat(transporterAfterTempStorageSchema);

// *******************************************************************
// HELPER FUNCTIONS THAT MAKE USES OF YUP SCHEMAS TO APPLY VALIDATION
// *******************************************************************

export async function checkCanBeSealed(form: Form) {
  // add linked objects schema
  const fullSchema = sealedFormSchema.concat(ecoOrganismeSchema);
  const ecoOrganisme = await prisma.form({ id: form.id }).ecoOrganisme();

  try {
    const validForm = await fullSchema.validate(
      { ...form, ecoOrganisme },
      {
        abortEarly: false
      }
    );
    return validForm;
  } catch (err) {
    if (err.name === "ValidationError") {
      const stringifiedErrors = err.errors?.join("\n");
      throw new UserInputError(
        `Erreur, impossible de sceller le bordereau car des champs obligatoires ne sont pas renseignés.\nErreur(s): ${stringifiedErrors}`
      );
    } else {
      throw err;
    }
  }
}
