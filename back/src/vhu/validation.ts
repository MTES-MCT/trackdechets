import {
  Prisma,
  VhuForm,
  VhuIdentificationType,
  VhuPackaging,
  WasteAcceptationStatus
} from "@prisma/client";
import { PROCESSING_OPERATIONS_CODES } from "../common/constants";
import {
  INVALID_SIRET_LENGTH,
  MISSING_COMPANY_ADDRESS,
  MISSING_COMPANY_CONTACT,
  MISSING_COMPANY_EMAIL,
  MISSING_COMPANY_NAME,
  MISSING_COMPANY_PHONE,
  MISSING_COMPANY_SIRET
} from "../forms/validation";
import * as yup from "yup";
import { FactorySchemaOf } from "../common/yup/configureYup";

type Emitter = Pick<
  VhuForm,
  | "emitterAgrementNumber"
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
  | "recipientAgrementNumber"
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
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "transporterRecepisseNumber"
  | "transporterRecepisseDepartment"
  | "transporterRecepisseValidityLimit"
>;

type Identification = Pick<
  VhuForm,
  "identificationNumbers" | "identificationType"
>;

type Quantity = Pick<VhuForm, "quantityNumber" | "quantityTons">;
type Packaging = Pick<VhuForm, "packaging">;

interface VhuValidationContext {
  emitterSignature?: boolean;
  transporterSignature?: boolean;
  recipientSignature?: boolean;
}

export function validateVhuForm(
  form: Partial<Prisma.VhuFormCreateInput>,
  context: VhuValidationContext
) {
  return emitterSchema(context)
    .concat(recipientSchema(context))
    .concat(transporterSchema(context))
    .concat(packagingSchema(context))
    .concat(identificationSchema(context))
    .concat(quantitySchema(context))
    .validate(form);
}

const emitterSchema: FactorySchemaOf<VhuValidationContext, Emitter> = context =>
  yup.object({
    emitterCompanyName: yup
      .string()
      .requiredIf(
        context.emitterSignature,
        `Émetteur: ${MISSING_COMPANY_NAME}`
      ),
    emitterCompanySiret: yup
      .string()
      .length(14, `Émetteur: ${INVALID_SIRET_LENGTH}`)
      .requiredIf(
        context.emitterSignature,
        `Émetteur: ${MISSING_COMPANY_SIRET}`
      ),
    emitterCompanyAddress: yup
      .string()
      .requiredIf(
        context.emitterSignature,
        `Émetteur: ${MISSING_COMPANY_ADDRESS}`
      ),
    emitterCompanyContact: yup
      .string()
      .requiredIf(
        context.emitterSignature,
        `Émetteur: ${MISSING_COMPANY_CONTACT}`
      ),
    emitterCompanyPhone: yup
      .string()
      .requiredIf(
        context.emitterSignature,
        `Émetteur: ${MISSING_COMPANY_PHONE}`
      ),
    emitterCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        context.emitterSignature,
        `Émetteur: ${MISSING_COMPANY_EMAIL}`
      ),
    emitterAgrementNumber: yup
      .string()
      .requiredIf(
        context.emitterSignature,
        `Émetteur: le numéro d'agréément est obligatoire`
      )
  });

const recipientSchema: FactorySchemaOf<
  VhuValidationContext,
  Recipient
> = context =>
  yup.object({
    recipientAcceptanceQuantity: yup
      .number()
      .requiredIf(
        context.recipientSignature,
        `Destinataire: la quantité reçue est obligatoire`
      ),
    recipientAcceptanceRefusalReason: yup.string().nullable(),
    recipientAgrementNumber: yup
      .string()
      .requiredIf(
        context.recipientSignature,
        `Destinataire: le numéro d'agréément est obligatoire`
      ),
    recipientAcceptanceStatus: yup
      .mixed<WasteAcceptationStatus>()
      .requiredIf(
        context.recipientSignature,
        `Destinataire: le statut d'acceptation est obligatoire`
      ),
    recipientOperationDone: yup
      .string()
      .oneOf([...PROCESSING_OPERATIONS_CODES, null, ""])
      .requiredIf(
        context.recipientSignature,
        `Destinataire: l'opération réalisée est obligatoire`
      ),
    recipientOperationPlanned: yup
      .string()
      .oneOf([...PROCESSING_OPERATIONS_CODES, null, ""])
      .requiredIf(
        context.emitterSignature,
        `Destinataire: l'opération prévue est obligatoire`
      ),
    recipientCompanyName: yup
      .string()
      .requiredIf(
        context.emitterSignature,
        `Destinataire: ${MISSING_COMPANY_NAME}`
      ),
    recipientCompanySiret: yup
      .string()
      .length(14, `Destination: ${INVALID_SIRET_LENGTH}`)
      .requiredIf(
        context.emitterSignature,
        `Destinataire: ${MISSING_COMPANY_SIRET}`
      ),
    recipientCompanyAddress: yup.string().when("$emitterSignature", {
      is: true,
      then: s => s.required(`Destination: ${MISSING_COMPANY_ADDRESS}`),
      otherwise: s => s.nullable()
    }),
    recipientCompanyContact: yup
      .string()
      .requiredIf(
        context.emitterSignature,
        `Destinataire: ${MISSING_COMPANY_CONTACT}`
      ),
    recipientCompanyPhone: yup
      .string()
      .requiredIf(
        context.emitterSignature,
        `Destinataire: ${MISSING_COMPANY_PHONE}`
      ),
    recipientCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        context.emitterSignature,
        `Destinataire: ${MISSING_COMPANY_EMAIL}`
      )
  });

const transporterSchema: FactorySchemaOf<
  VhuValidationContext,
  Transporter
> = context =>
  yup.object({
    transporterRecepisseDepartment: yup
      .string()
      .when("transporterTvaIntracommunautaire", (tva, schema) => {
        if (tva == null) {
          return schema.requiredIf(
            context.transporterSignature,
            `Transporteur: le département associé au récépissé est obligatoire`
          );
        }
        return schema.nullable().notRequired();
      }),
    transporterRecepisseNumber: yup
      .string()
      .when("transporterTvaIntracommunautaire", (tva, schema) => {
        if (tva == null) {
          return schema.requiredIf(
            context.transporterSignature,
            `Transporteur: le numéro de récépissé est obligatoire`
          );
        }
        return schema.nullable().notRequired();
      }),
    transporterRecepisseValidityLimit: yup
      .date()
      .requiredIf(
        context.transporterSignature,
        `Transporteur: ${MISSING_COMPANY_NAME}`
      ) as any,
    transporterCompanyName: yup
      .string()
      .requiredIf(
        context.transporterSignature,
        `Transporteur: ${MISSING_COMPANY_NAME}`
      ),
    transporterCompanySiret: yup
      .string()
      .length(14, `Transporteur: ${INVALID_SIRET_LENGTH}`)
      .when("transporterTvaIntracommunautaire", (tva, schema) => {
        if (tva == null) {
          return schema.requiredIf(
            context.transporterSignature,
            `Transporteur: le numéro SIRET est obligatoire pour une entreprise française`
          );
        }
        return schema.nullable().notRequired();
      }),
    transporterCompanyAddress: yup
      .string()
      .requiredIf(
        context.transporterSignature,
        `Transporteur: ${MISSING_COMPANY_ADDRESS}`
      ),
    transporterCompanyContact: yup
      .string()
      .requiredIf(
        context.transporterSignature,
        `Transporteur: ${MISSING_COMPANY_CONTACT}`
      ),
    transporterCompanyPhone: yup
      .string()
      .requiredIf(
        context.transporterSignature,
        `Transporteur: ${MISSING_COMPANY_PHONE}`
      ),
    transporterCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        context.transporterSignature,
        `Transporteur: ${MISSING_COMPANY_EMAIL}`
      )
  });

const identificationSchema: FactorySchemaOf<
  VhuValidationContext,
  Identification
> = context =>
  yup.object({
    identificationNumbers: yup.array().ensure().of(yup.string()) as any,
    identificationType: yup
      .mixed<VhuIdentificationType>()
      .requiredIf(
        context.emitterSignature,
        `Déchet: le type d'indentification est obligatoire`
      )
  });

const quantitySchema: FactorySchemaOf<
  VhuValidationContext,
  Quantity
> = context =>
  yup.object({
    quantityNumber: yup
      .number()
      .requiredIf(
        context.emitterSignature,
        `Déchet: la quantité est obligatoire`
      ),
    quantityTons: yup.number().nullable()
  });

const packagingSchema: FactorySchemaOf<
  VhuValidationContext,
  Packaging
> = context =>
  yup.object({
    packaging: yup
      .mixed<VhuPackaging>()
      .requiredIf(
        context.emitterSignature,
        `Déchet: le type d'empaquetage' est obligatoire`
      )
  });
