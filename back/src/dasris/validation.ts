import { WasteAcceptationStatus, Dasri, QuantityType } from "@prisma/client";

import * as yup from "yup";
import {
  DASRI_WASTE_CODES,
  DASRI_PROCESSING_OPERATIONS_CODES
} from "../common/constants";
import configureYup from "../common/yup/configureYup";
import validDatetime from "../common/yup/validDatetime";
import {
  DasriPackagings,
  DasriPackagingInfo
} from "../generated/graphql/types";

const wasteCodes = DASRI_WASTE_CODES.map(el => el.code);
// set yup default error messages
configureYup();

// *************************************************
// BREAK DOWN DASRI TYPE INTO INDIVIDUAL FRAME TYPES
// *************************************************

type Emitter = Pick<
  Dasri,
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
type Emission = Pick<
  Dasri,
  | "wasteDetailsCode"
  | "wasteDetailsOnuCode"
  | "emitterWasteQuantity"
  | "emitterWasteQuantityType"
  | "emitterWasteVolume"
  | "emitterWastePackagingsInfo"
  | "handedOverToTransporterAt"
  | "emissionSignedBy"
  | "emissionSignedAt"
>;

type Transporter = Pick<
  Dasri,
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "transporterReceipt"
  | "transporterReceiptDepartment"
  | "transporterReceiptValidityLimit"
>;
type Transport = Pick<
  Dasri,
  | "transporterWasteAcceptationStatus"
  | "transporterWasteRefusalReason"
  | "transporterWasteRefusedQuantity"
  | "transporterTakenOverAt"
  | "transporterWastePackagingsInfo"
  | "transporterWasteQuantity"
  | "transporterWasteQuantityType"
  | "transporterWasteVolume"
  | "handedOverToRecipientAt"
  | "transportSignedBy"
  | "transportSignedAt"
>;
type Recipient = Pick<
  Dasri,
  | "recipientCompanyName"
  | "recipientCompanySiret"
  | "recipientCompanyAddress"
  | "recipientCompanyContact"
  | "recipientCompanyPhone"
  | "recipientCompanyMail"
>;
type Reception = Pick<
  Dasri,
  | "recipientWastePackagingsInfo"
  | "recipientWasteAcceptationStatus"
  | "recipientWasteRefusalReason"
  | "recipientWasteRefusedQuantity"
  | "recipientWasteQuantity"
  | "recipientWasteVolume"
  | "receivedAt"
  | "receptionSignedBy"
  | "receptionSignedAt"
>;
type Operation = Pick<
  Dasri,
  | "processingOperation"
  | "processedAt"
  | "operationSignedBy"
  | "operationSignedAt"
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

const INVALID_DASRI_WASTE_CODE =
  "Ce code déchet n'est pas autorisé pour les DASRI";
const INVALID_PROCESSING_OPERATION =
  "Cette opération d’élimination / valorisation n'existe pas.";

export const emitterSchema: yup.ObjectSchema<
  Partial<Emitter>
> = yup.object().shape({
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

const packagingsTypes: DasriPackagings[] = [
  "BOITE_CARTON",
  "FUT",
  "BOITE_PERFORANTS",
  "GRAND_EMBALLAGE",
  "VRAC",
  "AUTRE"
];
export const packagingInfo: yup.ObjectSchema<DasriPackagingInfo> = yup
  .object()
  .shape({
    type: yup
      .mixed()
      .required("Le type de conditionnement doit être précisé.")
      .oneOf(packagingsTypes),
    other: yup
      .string()
      .when("type", (type, schema) =>
        type === "AUTRE"
          ? schema.required(
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
      .required(
        "Le nombre de colis associé au conditionnement doit être précisé."
      )
      .integer()
      .min(1, "Le nombre de colis doit être supérieur à 0."),
    volume: yup
      .number()
      .required(
        "Le volume en litres associé à chaque type de contenant doit être précisé."
      )
      .integer()
      .min(1, "Le volume de chaque type de contenant doit être supérieur à 0.")
  });

export const emissionSchema: yup.ObjectSchema<
  Partial<Emission>
> = yup.object().shape({
  wasteDetailsCode: yup
    .string()
    .ensure()
    .required("Le code déchet est obligatoire")
    .oneOf(wasteCodes, INVALID_DASRI_WASTE_CODE),
  wasteDetailsOnuCode: yup
    .string()
    .ensure()
    .required(`La mention ADR est obligatoire.`),
  emitterWasteQuantity: yup
    .number()
    .required("La quantité du déchet émis en tonnes est obligatoire")
    .min(0, "La quantité émise doit être supérieure à 0"),
  emitterWasteQuantityType: yup
    .mixed<QuantityType>()
    .required("Le type de quantité (réelle ou estimée) émis doit être précisé"),
  emitterWastePackagingsInfo: yup
    .array()
    .required("Le détail du conditionnement émis est obligatoire")
    .of(packagingInfo)
});

export const transporterSchema: yup.ObjectSchema<
  Partial<Transporter>
> = yup.object().shape({
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
  transporterReceipt: yup.string().ensure().required(),

  transporterReceiptDepartment: yup
    .string()
    .ensure()
    .required("Le département du transporteur est obligatoire"),

  transporterReceiptValidityLimit: validDatetime({
    verboseFieldName: "date de validité"
  })
});

export const transportSchema: yup.ObjectSchema<
  Partial<Transport>
> = yup.object().shape({
  transporterWasteAcceptationStatus: yup
    .mixed<WasteAcceptationStatus>()
    .required(),

  transporterWasteRefusedQuantity: yup
    .number()
    .when("transporterWasteAcceptationStatus", (type, schema) =>
      ["REFUSED", "PARTIALLY_REFUSED"].includes(type)
        ? schema
            .required("La quantité de déchets refusés doit être précisée.")
            .min(0, "La quantité doit être supérieure à 0")
        : schema
            .nullable()
            .notRequired()
            .test(
              "is-empty",
              "Le champ transporterWasteRefusedQuantity ne doit pas être renseigné si le déchet est accepté ",
              v => !v
            )
    ),
  transporterWasteRefusalReason: yup
    .string()
    .when("transporterWasteAcceptationStatus", (type, schema) =>
      ["REFUSED", "PARTIALLY_REFUSED"].includes(type)
        ? schema.required("Vous devez saisir un motif de refus")
        : schema
            .nullable()
            .notRequired()
            .test(
              "is-empty",
              "Le champ transporterWasteRefusalReason ne doit pas être renseigné si le déchet est accepté ",
              v => !v
            )
    ),
  transporterWasteQuantity: yup
    .number()
    .required("La quantité du déchet transporté en tonnes est obligatoire")
    .min(0, "La quantité transportée doit être supérieure à 0"),
  transporterWasteQuantityType: yup
    .mixed<QuantityType>()
    .required(
      "Le type de quantité (réelle ou estimée) transportée doit être précisé"
    ),
  transporterWastePackagingsInfo: yup
    .array()
    .required("Le détail du conditionnement transporté est obligatoire")
    .of(packagingInfo),
  transporterTakenOverAt: validDatetime({
    verboseFieldName: "date de prise en charge par le transporteur",
    required: true
  }),
  handedOverToRecipientAt: validDatetime({
    verboseFieldName: "date de remise du déchet au destinataire",
    required: false
  })
});

export const recipientSchema: yup.ObjectSchema<
  Partial<Recipient>
> = yup.object().shape({
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

export const receptionSchema: yup.ObjectSchema<
  Partial<Reception>
> = yup.object().shape({
  recipientWasteAcceptationStatus: yup
    .mixed<WasteAcceptationStatus>()
    .required(),

  recipientWasteRefusedQuantity: yup
    .number()
    .nullable()
    .notRequired()
    .min(0, "La quantité doit être supérieure à 0"),
  recipientWasteQuantity: yup
    .number()
    .required("La quantité du déchet en tonnes est obligatoire")
    .min(0, "La quantité doit être supérieure à 0"),

  recipientWastePackagingsInfo: yup
    .array()
    .required("Le détail du conditionnement est obligatoire")
    .of(packagingInfo)
});

export const operationSchema: yup.ObjectSchema<
  Partial<Operation>
> = yup.object().shape({
  processingOperation: yup
    .string()
    .label("Opération d’élimination / valorisation")
    .oneOf(DASRI_PROCESSING_OPERATIONS_CODES, INVALID_PROCESSING_OPERATION)
});

export const dasriDraftSchema = yup.object().shape({
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
    .oneOf([...wasteCodes, "", null], INVALID_DASRI_WASTE_CODE),
  transporterCompanySiret: yup
    .string()
    .notRequired()
    .nullable()
    .matches(/^$|^\d{14}$/, {
      message: `Transporteur: ${INVALID_SIRET_LENGTH}`
    }),
  transporterCompanyMail: yup.string().notRequired().nullable().email()
});

// validation schema for Dasri before it can be sealed
export const okForSealedFormSchema = yup.object().shape({
  emitterCompanySiret: yup.string().matches(/^\d{14}$/, {
    message: `Émetteur: ${INVALID_SIRET_LENGTH}`
  }),
  emitterCompanyMail: yup.string().email().required(),
  recipientCompanySiret: yup.string().matches(/^\d{14}$/, {
    message: `Destinataire: ${INVALID_SIRET_LENGTH}`
  }),
  recipientCompanyMail: yup.string().email().required(),
  wasteDetailsCode: yup
    .string()
    .oneOf([...wasteCodes, "", null], INVALID_DASRI_WASTE_CODE),
  transporterCompanySiret: yup.string().matches(/^\d{14}$/, {
    message: `Transporteur: ${INVALID_SIRET_LENGTH}`
  }),
  transporterCompanyMail: yup.string().email().required()
});

export const okForEmissionSignatureSchema = emitterSchema.concat(
  emissionSchema
);
// we need to also check check emission
// transition from SEALED to SENT is possible if explicitly allowed by emitting company (field allowDasriTakeOverWithoutSignature)
export const okForTransportSignatureSchema = transporterSchema
  .concat(transportSchema)
  .concat(okForEmissionSignatureSchema);

export const okForReceptionSignatureSchema = recipientSchema.concat(
  receptionSchema
);
export const okForProcessingSignatureSchema = okForReceptionSignatureSchema.concat(
  operationSchema
);
