import {
  Prisma,
  Bsvhu,
  BsvhuIdentificationType,
  BsvhuPackaging,
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
import { BsvhuDestinationType } from "../generated/graphql/types";

type Emitter = Pick<
  Bsvhu,
  | "emitterAgrementNumber"
  | "emitterCompanyName"
  | "emitterCompanySiret"
  | "emitterCompanyAddress"
  | "emitterCompanyContact"
  | "emitterCompanyPhone"
  | "emitterCompanyMail"
>;

type Destination = Pick<
  Bsvhu,
  | "destinationType"
  | "destinationAgrementNumber"
  | "destinationCompanyName"
  | "destinationCompanySiret"
  | "destinationCompanyAddress"
  | "destinationCompanyContact"
  | "destinationCompanyPhone"
  | "destinationCompanyMail"
  | "destinationPlannedOperationCode"
  | "destinationReceptionWeight"
  | "destinationReceptionAcceptationStatus"
  | "destinationReceptionRefusalReason"
  | "destinationOperationCode"
>;

type Transporter = Pick<
  Bsvhu,
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
  Bsvhu,
  "identificationNumbers" | "identificationType"
>;

type Quantity = Pick<Bsvhu, "quantity">;

type Weight = Pick<Bsvhu, "weightValue" | "weightIsEstimate">;
type Packaging = Pick<Bsvhu, "packaging">;

interface VhuValidationContext {
  emissionSignature?: boolean;
  transportSignature?: boolean;
  operationSignature?: boolean;
}

export function validateBsvhu(
  form: Partial<Prisma.BsvhuCreateInput>,
  context: VhuValidationContext
) {
  return emitterSchema(context)
    .concat(destinationSchema(context))
    .concat(transporterSchema(context))
    .concat(packagingSchema(context))
    .concat(identificationSchema(context))
    .concat(weightSchema(context))
    .concat(quantitySchema(context))
    .validate(form, { abortEarly: false });
}

const emitterSchema: FactorySchemaOf<VhuValidationContext, Emitter> = context =>
  yup.object({
    emitterCompanyName: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Émetteur: ${MISSING_COMPANY_NAME}`
      ),
    emitterCompanySiret: yup
      .string()
      .length(14, `Émetteur: ${INVALID_SIRET_LENGTH}`)
      .requiredIf(
        context.emissionSignature,
        `Émetteur: ${MISSING_COMPANY_SIRET}`
      ),
    emitterCompanyAddress: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Émetteur: ${MISSING_COMPANY_ADDRESS}`
      ),
    emitterCompanyContact: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Émetteur: ${MISSING_COMPANY_CONTACT}`
      ),
    emitterCompanyPhone: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Émetteur: ${MISSING_COMPANY_PHONE}`
      ),
    emitterCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        context.emissionSignature,
        `Émetteur: ${MISSING_COMPANY_EMAIL}`
      ),
    emitterAgrementNumber: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Émetteur: le numéro d'agrément est obligatoire`
      )
  });

const destinationSchema: FactorySchemaOf<
  VhuValidationContext,
  Destination
> = context =>
  yup.object({
    destinationType: yup
      .mixed<BsvhuDestinationType>()
      .requiredIf(
        context.emissionSignature,
        `Destinataire: le type de destination est obligatoire`
      ),
    destinationReceptionWeight: yup
      .number()
      .requiredIf(
        context.operationSignature,
        `Destinataire: le poids reçu est obligatoire`
      ),
    destinationReceptionRefusalReason: yup.string().nullable(),
    destinationAgrementNumber: yup
      .string()
      .requiredIf(
        context.operationSignature,
        `Destinataire: le numéro d'agrément est obligatoire`
      ),
    destinationReceptionAcceptationStatus: yup
      .mixed<WasteAcceptationStatus>()
      .requiredIf(
        context.operationSignature,
        `Destinataire: le statut d'acceptation est obligatoire`
      ),
    destinationOperationCode: yup
      .string()
      .oneOf([...PROCESSING_OPERATIONS_CODES, null, ""])
      .requiredIf(
        context.operationSignature,
        `Destinataire: l'opération réalisée est obligatoire`
      ),
    destinationPlannedOperationCode: yup
      .string()
      .oneOf([...PROCESSING_OPERATIONS_CODES, null, ""])
      .requiredIf(
        context.emissionSignature,
        `Destinataire: l'opération prévue est obligatoire`
      ),
    destinationCompanyName: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Destinataire: ${MISSING_COMPANY_NAME}`
      ),
    destinationCompanySiret: yup
      .string()
      .length(14, `Destination: ${INVALID_SIRET_LENGTH}`)
      .requiredIf(
        context.emissionSignature,
        `Destinataire: ${MISSING_COMPANY_SIRET}`
      ),
    destinationCompanyAddress: yup.string().when("$emitterSignature", {
      is: true,
      then: s => s.required(`Destination: ${MISSING_COMPANY_ADDRESS}`),
      otherwise: s => s.nullable()
    }),
    destinationCompanyContact: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Destinataire: ${MISSING_COMPANY_CONTACT}`
      ),
    destinationCompanyPhone: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Destinataire: ${MISSING_COMPANY_PHONE}`
      ),
    destinationCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        context.emissionSignature,
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
            context.transportSignature,
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
            context.transportSignature,
            `Transporteur: le numéro de récépissé est obligatoire`
          );
        }
        return schema.nullable().notRequired();
      }),
    transporterRecepisseValidityLimit: yup
      .date()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_NAME}`
      ) as any,
    transporterCompanyName: yup
      .string()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_NAME}`
      ),
    transporterCompanySiret: yup
      .string()
      .length(14, `Transporteur: ${INVALID_SIRET_LENGTH}`)
      .when("transporterTvaIntracommunautaire", (tva, schema) => {
        if (tva == null) {
          return schema.requiredIf(
            context.transportSignature,
            `Transporteur: le numéro SIRET est obligatoire pour une entreprise française`
          );
        }
        return schema.nullable().notRequired();
      }),
    transporterCompanyAddress: yup
      .string()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_ADDRESS}`
      ),
    transporterCompanyContact: yup
      .string()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_CONTACT}`
      ),
    transporterCompanyPhone: yup
      .string()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_PHONE}`
      ),
    transporterCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        context.transportSignature,
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
      .mixed<BsvhuIdentificationType>()
      .requiredIf(
        context.emissionSignature,
        `Déchet: le type d'indentification est obligatoire`
      )
  });

const quantitySchema: FactorySchemaOf<
  VhuValidationContext,
  Quantity
> = context =>
  yup.object({
    quantity: yup
      .number()
      .requiredIf(
        context.emissionSignature,
        `Déchet: la quantité est obligatoire`
      )
  });

const weightSchema: FactorySchemaOf<VhuValidationContext, Weight> = context =>
  yup.object({
    weightValue: yup
      .number()
      .requiredIf(
        context.emissionSignature,
        `Déchet: le poids est obligatoire`
      ),
    weightIsEstimate: yup.boolean().nullable()
  });

const packagingSchema: FactorySchemaOf<
  VhuValidationContext,
  Packaging
> = context =>
  yup.object({
    packaging: yup
      .mixed<BsvhuPackaging>()
      .requiredIf(
        context.emissionSignature,
        `Déchet: le type d'empaquetage' est obligatoire`
      )
  });
