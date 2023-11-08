import {
  Prisma,
  BsvhuIdentificationType,
  BsvhuPackaging,
  WasteAcceptationStatus,
  OperationMode
} from "@prisma/client";
import { PROCESSING_OPERATIONS_CODES } from "shared/constants";
import {
  MISSING_COMPANY_ADDRESS,
  MISSING_COMPANY_CONTACT,
  MISSING_COMPANY_EMAIL,
  MISSING_COMPANY_NAME,
  MISSING_COMPANY_PHONE,
  MISSING_COMPANY_SIRET
} from "../forms/errors";
import * as yup from "yup";
import { FactorySchemaOf } from "../common/yup/configureYup";
import { BsvhuDestinationType } from "../generated/graphql/types";
import {
  foreignVatNumber,
  siret,
  siretConditions,
  siretTests,
  vatNumberTests,
  weight,
  weightConditions,
  WeightUnits,
  transporterRecepisseSchema
} from "../common/validation";
import { getOperationModesFromOperationCode } from "../common/operationModes";

type Emitter = Pick<
  Prisma.BsvhuCreateInput,
  | "emitterAgrementNumber"
  | "emitterCompanyName"
  | "emitterCompanySiret"
  | "emitterCompanyAddress"
  | "emitterCompanyContact"
  | "emitterCompanyPhone"
  | "emitterCompanyMail"
>;

type Destination = Pick<
  Prisma.BsvhuCreateInput,
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
  Prisma.BsvhuCreateInput,
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "transporterRecepisseNumber"
  | "transporterRecepisseDepartment"
  | "transporterRecepisseValidityLimit"
  | "transporterCompanyVatNumber"
>;

type Identification = Pick<
  Prisma.BsvhuCreateInput,
  "identificationNumbers" | "identificationType"
>;

type Quantity = Pick<Prisma.BsvhuCreateInput, "quantity">;

type Weight = Pick<Prisma.BsvhuCreateInput, "weightValue" | "weightIsEstimate">;
type Packaging = Pick<Prisma.BsvhuCreateInput, "packaging">;

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
    emitterCompanySiret: siret
      .label("Émetteur")
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
    destinationReceptionWeight: weight(WeightUnits.Kilogramme)
      .label("Destinataire")
      .when(
        "destinationReceptionAcceptationStatus",
        weightConditions.wasteAcceptationStatus
      )
      .requiredIf(
        context.operationSignature,
        "${path}: le poids reçu est obligatoire"
      ),
    destinationReceptionRefusalReason: yup.string().nullable(),
    destinationAgrementNumber: yup
      .string()
      .requiredIf(
        context.emissionSignature,
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
    destinationOperationMode: yup
      .mixed<OperationMode | null | undefined>()
      .oneOf([...Object.values(OperationMode), null, undefined])
      .nullable()
      .test(
        "processing-mode-matches-processing-operation",
        "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie",
        function (item) {
          const { destinationOperationCode } = this.parent;
          const destinationOperationMode = item;

          if (destinationOperationCode) {
            const modes = getOperationModesFromOperationCode(
              destinationOperationCode
            );

            if (modes.length && !destinationOperationMode) {
              return new yup.ValidationError(
                "Vous devez préciser un mode de traitement"
              );
            } else if (
              (modes.length &&
                destinationOperationMode &&
                !modes.includes(destinationOperationMode)) ||
              (!modes.length && destinationOperationMode)
            ) {
              return new yup.ValidationError(
                "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
              );
            }
          }

          return true;
        }
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
    destinationCompanySiret: siret
      .label("Destination")
      .test(siretTests.isRegistered("WASTE_VEHICLES"))
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
    transporterCompanyName: yup
      .string()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_NAME}`
      ),
    transporterCompanySiret: siret
      .label("Transporteur")
      .test(siretTests.isRegistered("TRANSPORTER"))
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_SIRET}`
      )
      .when("transporterCompanyVatNumber", siretConditions.companyVatNumber),
    transporterCompanyVatNumber: foreignVatNumber
      .label("Transporteur")
      .test(vatNumberTests.isRegisteredTransporter),
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
      ),
    ...transporterRecepisseSchema(context)
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
    weightValue: weight(WeightUnits.Kilogramme)
      .label("Déchet")
      .requiredIf(
        context.emissionSignature,
        "${path}: le poids est obligatoire"
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
