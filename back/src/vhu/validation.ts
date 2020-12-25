import {
  IdentificationType,
  PackagingType,
  Prisma,
  VhuForm,
  VhuQuantityUnit,
  WasteAcceptationStatus
} from "@prisma/client";
import { PROCESSING_OPERATIONS_CODES } from "src/common/constants";
import validDatetime from "src/common/yup/validDatetime";
import {
  INVALID_SIRET_LENGTH,
  MISSING_COMPANY_ADDRESS,
  MISSING_COMPANY_CONTACT,
  MISSING_COMPANY_EMAIL,
  MISSING_COMPANY_NAME,
  MISSING_COMPANY_PHONE,
  MISSING_COMPANY_SIRET
} from "src/forms/validation";
import * as yup from "yup";

type Emitter = Pick<
  VhuForm,
  | "emitterAgreement"
  | "emitterValidityLimit"
  | "emitterCompanyName"
  | "emitterCompanySiret"
  | "emitterCompanyAddress"
  | "emitterCompanyContact"
  | "emitterCompanyPhone"
  | "emitterCompanyMail"
>;

type Recipient = Pick<
  VhuForm,
  | "recipientOperationPlanned"
  | "recipientAgreement"
  | "recipientValidityLimit"
  | "recipientCompanyName"
  | "recipientCompanySiret"
  | "recipientCompanyAddress"
  | "recipientCompanyContact"
  | "recipientCompanyPhone"
  | "recipientCompanyMail"
  | "recipientAcceptanceQuantity"
  | "recipientAcceptanceStatus"
  | "recipientAcceptanceRefusalReason"
  | "recipientOperationDone"
>;

type Transporter = Pick<
  VhuForm,
  | "transporterAgreement"
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "transporterReceipt"
  | "transporterDepartment"
  | "transporterValidityLimit"
  | "transporterTransportType"
>;

type WasteDetails = Pick<
  VhuForm,
  | "wasteDetailsPackagingType"
  | "wasteDetailsIdentificationNumbers"
  | "wasteDetailsIdentificationType"
  | "wasteDetailsQuantity"
  | "wasteDetailsQuantityUnit"
>;

interface VhuValidationContext {
  emitterSignature?: boolean;
  transporterSignature?: boolean;
  recipientAcceptanceSignature?: boolean;
  recipientOperationSignature?: boolean;
}

export function validateVhuForm(
  form: Partial<Prisma.VhuFormCreateInput>,
  context: VhuValidationContext
) {
  return emitterSchema
    .concat(recipientSchema)
    .concat(transporterSchema)
    .concat(wasteDetailsSchema)
    .validate(form, { context });
}

const emitterSchema: yup.ObjectSchema<Emitter> = yup.object().shape({
  emitterCompanyName: yup.string().when("$emitterSignature", {
    is: true,
    then: s => s.required(`Émetteur: ${MISSING_COMPANY_NAME}`),
    otherwise: s => s.nullable()
  }),
  emitterCompanySiret: yup
    .string()
    .length(14, `Émetteur: ${INVALID_SIRET_LENGTH}`)
    .when("$emitterSignature", {
      is: true,
      then: s => s.required(`Émetteur: ${MISSING_COMPANY_SIRET}`),
      otherwise: s => s.nullable()
    }),
  emitterCompanyAddress: yup.string().when("$emitterSignature", {
    is: true,
    then: s => s.required(`Émetteur: ${MISSING_COMPANY_ADDRESS}`),
    otherwise: s => s.nullable()
  }),
  emitterCompanyContact: yup.string().when("$emitterSignature", {
    is: true,
    then: s => s.required(`Émetteur: ${MISSING_COMPANY_CONTACT}`),
    otherwise: s => s.nullable()
  }),
  emitterCompanyPhone: yup.string().when("$emitterSignature", {
    is: true,
    then: s => s.required(`Émetteur: ${MISSING_COMPANY_PHONE}`),
    otherwise: s => s.nullable()
  }),
  emitterCompanyMail: yup
    .string()
    .email()
    .when("$emitterSignature", {
      is: true,
      then: s => s.required(`Émetteur: ${MISSING_COMPANY_EMAIL}`),
      otherwise: s => s.nullable()
    }),
  emitterValidityLimit: validDatetime({
    verboseFieldName: "date de validité",
    required: false // TODO VHU depend on context
  }),
  emitterAgreement: yup.string().when("$emitterSignature", {
    is: true,
    then: s => s.required(`Émetteur: l'agréément est obligatoire`),
    otherwise: s => s.nullable()
  })
});

const recipientSchema: yup.ObjectSchema<Recipient> = yup.object().shape({
  recipientAcceptanceQuantity: yup
    .number()
    .when("$recipientAcceptanceSignature", {
      is: true,
      then: s => s.required(`Destinataire: la quantité reçue est obligatoire`),
      otherwise: s => s.nullable()
    }),
  recipientAcceptanceRefusalReason: yup.string().nullable(),
  recipientAgreement: yup.string().when("$emitterSignature", {
    is: true,
    then: s => s.required(`Destinataire: l'agréément est obligatoire`),
    otherwise: s => s.nullable()
  }),
  recipientAcceptanceStatus: yup
    .mixed<WasteAcceptationStatus>()
    .when("$recipientAcceptanceSignature", {
      is: true,
      then: s =>
        s.required(`Destinataire: le statut d'acceptation est obligatoire`),
      otherwise: s => s.nullable()
    }),
  recipientOperationDone: yup
    .string()
    .oneOf([...PROCESSING_OPERATIONS_CODES, null])
    .when("$recipientOpetrationSignature", {
      is: true,
      then: s =>
        s.required(`Destinataire: l'opération réalisée est obligatoire`),
      otherwise: s => s.nullable()
    }),
  recipientOperationPlanned: yup
    .string()
    .oneOf([...PROCESSING_OPERATIONS_CODES, null])
    .when("$emitterSignature", {
      is: true,
      then: s => s.required(`Destinataire: l'opération prévue est obligatoire`),
      otherwise: s => s.nullable()
    }),
  recipientValidityLimit: validDatetime({
    verboseFieldName: "date de validité",
    required: false // TODO VHU depend on context
  }),
  recipientCompanyName: yup.string().when("$emitterSignature", {
    is: true,
    then: s => s.required(`Destination: ${MISSING_COMPANY_NAME}`),
    otherwise: s => s.nullable()
  }),
  recipientCompanySiret: yup
    .string()
    .length(14, `Destination: ${INVALID_SIRET_LENGTH}`)
    .when("$emitterSignature", {
      is: true,
      then: s => s.required(`Destination: ${MISSING_COMPANY_SIRET}`),
      otherwise: s => s.nullable()
    }),
  recipientCompanyAddress: yup.string().when("$emitterSignature", {
    is: true,
    then: s => s.required(`Destination: ${MISSING_COMPANY_ADDRESS}`),
    otherwise: s => s.nullable()
  }),
  recipientCompanyContact: yup.string().when("$emitterSignature", {
    is: true,
    then: s => s.required(`Destination: ${MISSING_COMPANY_CONTACT}`),
    otherwise: s => s.nullable()
  }),
  recipientCompanyPhone: yup.string().when("$emitterSignature", {
    is: true,
    then: s => s.required(`Destination: ${MISSING_COMPANY_PHONE}`),
    otherwise: s => s.nullable()
  }),
  recipientCompanyMail: yup
    .string()
    .email()
    .when("$emitterSignature", {
      is: true,
      then: s => s.required(`Destination: ${MISSING_COMPANY_EMAIL}`),
      otherwise: s => s.nullable()
    })
});

const transporterSchema: yup.ObjectSchema<Transporter> = yup.object().shape({
  transporterAgreement: yup.string().when("$transporterSignature", {
    is: true,
    then: s => s.required(`Transporteur: l'agréément est obligatoire`),
    otherwise: s => s.nullable()
  }),
  transporterDepartment: yup.string().when("$transporterSignature", {
    is: true,
    then: s => s.required(`Transporteur: le département est obligatoire`),
    otherwise: s => s.nullable()
  }),
  transporterReceipt: yup.string().when("$transporterSignature", {
    is: true,
    then: s => s.required(`Transporteur: le récepissé est obligatoire`),
    otherwise: s => s.nullable()
  }),
  transporterTransportType: yup.string().when("$transporterSignature", {
    is: true,
    then: s => s.required(`Transporteur: le type de transport est obligatoire`),
    otherwise: s => s.nullable()
  }),
  transporterValidityLimit: validDatetime({
    verboseFieldName: "date de validité",
    required: false // TODO VHU depend on context
  }),
  transporterCompanyName: yup.string().when("$transporterSignature", {
    is: true,
    then: s => s.required(`Transporteur: ${MISSING_COMPANY_NAME}`),
    otherwise: s => s.nullable()
  }),
  transporterCompanySiret: yup
    .string()
    .length(14, `Transporteur: ${INVALID_SIRET_LENGTH}`)
    .when("$transporterSignature", {
      is: true,
      then: s => s.required(`Transporteur: ${MISSING_COMPANY_SIRET}`),
      otherwise: s => s.nullable()
    }),
  transporterCompanyAddress: yup.string().when("$transporterSignature", {
    is: true,
    then: s => s.required(`Transporteur: ${MISSING_COMPANY_ADDRESS}`),
    otherwise: s => s.nullable()
  }),
  transporterCompanyContact: yup.string().when("$transporterSignature", {
    is: true,
    then: s => s.required(`Transporteur: ${MISSING_COMPANY_CONTACT}`),
    otherwise: s => s.nullable()
  }),
  transporterCompanyPhone: yup.string().when("$transporterSignature", {
    is: true,
    then: s => s.required(`Transporteur: ${MISSING_COMPANY_PHONE}`),
    otherwise: s => s.nullable()
  }),
  transporterCompanyMail: yup
    .string()
    .email()
    .when("$transporterSignature", {
      is: true,
      then: s => s.required(`Transporteur: ${MISSING_COMPANY_EMAIL}`),
      otherwise: s => s.nullable()
    })
});

const wasteDetailsSchema: yup.ObjectSchema<WasteDetails> = yup.object().shape({
  wasteDetailsIdentificationNumbers: yup.array().ensure().of(yup.string()),
  wasteDetailsIdentificationType: yup
    .mixed<IdentificationType>()
    .when("$emitterSignature", {
      is: true,
      then: s =>
        s.required(`Déchet: le type d'indentification est obligatoire`),
      otherwise: s => s.nullable()
    }),
  wasteDetailsPackagingType: yup
    .mixed<PackagingType>()
    .when("$emitterSignature", {
      is: true,
      then: s => s.required(`Déchet: le type d'empaquetage' est obligatoire`),
      otherwise: s => s.nullable()
    }),
  wasteDetailsQuantity: yup.number().when("$emitterSignature", {
    is: true,
    then: s => s.required(`Déchet: la quantité est obligatoire`),
    otherwise: s => s.nullable()
  }),
  wasteDetailsQuantityUnit: yup
    .mixed<VhuQuantityUnit>()
    .when("$emitterSignature", {
      is: true,
      then: s => s.required(`Déchet: le type est obligatoire`),
      otherwise: s => s.nullable()
    })
});
