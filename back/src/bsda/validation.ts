import { Prisma, Bsda } from "@prisma/client";
import * as yup from "yup";
import { WASTES_CODES } from "../common/constants";
import { FactorySchemaOf } from "../common/yup/configureYup";
import {
  INVALID_SIRET_LENGTH,
  INVALID_WASTE_CODE,
  MISSING_COMPANY_ADDRESS,
  MISSING_COMPANY_CONTACT,
  MISSING_COMPANY_EMAIL,
  MISSING_COMPANY_NAME,
  MISSING_COMPANY_PHONE,
  MISSING_COMPANY_SIRET
} from "../forms/validation";
import {
  BsdaAcceptationStatus,
  BsdaConsistence,
  BsdaQuantityType
} from "../generated/graphql/types";

type Emitter = Pick<
  Bsda,
  | "emitterIsPrivateIndividual"
  | "emitterCompanyName"
  | "emitterCompanySiret"
  | "emitterCompanyAddress"
  | "emitterCompanyContact"
  | "emitterCompanyPhone"
  | "emitterCompanyMail"
  | "emitterWorkSiteName"
  | "emitterWorkSiteAddress"
  | "emitterWorkSiteCity"
  | "emitterWorkSitePostalCode"
  | "emitterWorkSiteInfos"
>;

type Worker = Pick<
  Bsda,
  | "workerCompanyName"
  | "workerCompanySiret"
  | "workerCompanyAddress"
  | "workerCompanyContact"
  | "workerCompanyPhone"
  | "workerCompanyMail"
  | "workerWorkHasEmitterPaperSignature"
>;

type Destination = Pick<
  Bsda,
  | "destinationCompanyName"
  | "destinationCompanySiret"
  | "destinationCompanyAddress"
  | "destinationCompanyContact"
  | "destinationCompanyPhone"
  | "destinationCompanyMail"
  | "destinationCap"
  | "destinationPlannedOperationCode"
  | "destinationReceptionDate"
  | "destinationReceptionQuantityType"
  | "destinationReceptionQuantityValue"
  | "destinationReceptionAcceptationStatus"
  | "destinationReceptionRefusalReason"
  | "destinationOperationCode"
  | "destinationOperationDate"
>;

type Transporter = Pick<
  Bsda,
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "transporterCompanyVatNumber"
  | "transporterRecepisseNumber"
  | "transporterRecepisseDepartment"
  | "transporterRecepisseValidityLimit"
>;

type WasteDescription = Pick<
  Bsda,
  | "wasteCode"
  | "wasteName"
  | "wasteFamilyCode"
  | "wasteMaterialName"
  | "wasteConsistence"
  | "wasteSealNumbers"
  | "wasteAdr"
  | "packagings"
  | "quantityType"
  | "quantityValue"
>;

interface BsdaValidationContext {
  emissionSignature?: boolean;
  transportSignature?: boolean;
  operationSignature?: boolean;
  workSignature?: boolean;
}

export function validateBsda(
  form: Partial<Prisma.BsdaCreateInput>,
  context: BsdaValidationContext
) {
  return emitterSchema(context)
    .concat(workerSchema(context))
    .concat(destinationSchema(context))
    .concat(transporterSchema(context))
    .concat(wasteDescriptionSchema(context))
    .validate(form, { abortEarly: false });
}

const emitterSchema: FactorySchemaOf<
  BsdaValidationContext,
  Emitter
> = context =>
  yup.object({
    emitterIsPrivateIndividual: yup
      .boolean()
      .requiredIf(
        context.emissionSignature,
        `Émetteur: vous devez précisez si c'est un particulier ou un professionnel`
      ),
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
    emitterWorkSiteAddress: yup.string().nullable(),
    emitterWorkSiteCity: yup.string().nullable(),
    emitterWorkSiteInfos: yup.string().nullable(),
    emitterWorkSiteName: yup.string().nullable(),
    emitterWorkSitePostalCode: yup.string().nullable()
  });

const workerSchema: FactorySchemaOf<BsdaValidationContext, Worker> = context =>
  yup.object({
    workerCompanyName: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de travaux: ${MISSING_COMPANY_NAME}`
      ),
    workerCompanySiret: yup
      .string()
      .length(14, `Entreprise de travaux: ${INVALID_SIRET_LENGTH}`)
      .requiredIf(
        context.emissionSignature,
        `Entreprise de travaux: ${MISSING_COMPANY_SIRET}`
      ),
    workerCompanyAddress: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de travaux: ${MISSING_COMPANY_ADDRESS}`
      ),
    workerCompanyContact: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de travaux: ${MISSING_COMPANY_CONTACT}`
      ),
    workerCompanyPhone: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de travaux: ${MISSING_COMPANY_PHONE}`
      ),
    workerCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de travaux: ${MISSING_COMPANY_EMAIL}`
      ),
    workerWorkHasEmitterPaperSignature: yup.boolean().nullable()
  });

const destinationSchema: FactorySchemaOf<
  BsdaValidationContext,
  Destination
> = context =>
  yup.object({
    destinationCompanyName: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de destination: ${MISSING_COMPANY_NAME}`
      ),
    destinationCompanySiret: yup
      .string()
      .length(14, `Entreprise de destination: ${INVALID_SIRET_LENGTH}`)
      .requiredIf(
        context.emissionSignature,
        `Entreprise de destination: ${MISSING_COMPANY_SIRET}`
      ),
    destinationCompanyAddress: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de destination: ${MISSING_COMPANY_ADDRESS}`
      ),
    destinationCompanyContact: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de destination: ${MISSING_COMPANY_CONTACT}`
      ),
    destinationCompanyPhone: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de destination: ${MISSING_COMPANY_PHONE}`
      ),
    destinationCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de destination: ${MISSING_COMPANY_EMAIL}`
      ),
    destinationCap: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de destination: CAP obligatoire`
      ),
    destinationPlannedOperationCode: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de destination: vous devez préciser le code d'opétation prévu`
      ),
    destinationReceptionDate: yup
      .date()
      .requiredIf(
        context.operationSignature,
        `Entreprise de destination:vous devez préciser la date de réception`
      ) as any,
    destinationReceptionQuantityType: yup
      .mixed<BsdaQuantityType>()
      .requiredIf(
        context.operationSignature,
        `Entreprise de destination: vous devez préciser le type de quantité`
      ),
    destinationReceptionQuantityValue: yup
      .number()
      .requiredIf(
        context.operationSignature,
        `Entreprise de destination: vous devez préciser la quantité`
      ),
    destinationReceptionAcceptationStatus: yup
      .mixed<BsdaAcceptationStatus>()
      .requiredIf(
        context.operationSignature,
        `Entreprise de destination: vous devez préciser le statut d'acceptation`
      ),
    destinationReceptionRefusalReason: yup.string().nullable(),
    destinationOperationCode: yup
      .string()
      .requiredIf(
        context.operationSignature,
        `Entreprise de destination: vous devez préciser le code d'opétation réalisé`
      ),
    destinationOperationDate: yup
      .date()
      .requiredIf(
        context.operationSignature,
        `Entreprise de destination:vous devez préciser la date d'opétation`
      ) as any
  });

const transporterSchema: FactorySchemaOf<
  BsdaValidationContext,
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
      ),
    transporterCompanyVatNumber: yup.string().nullable()
  });

const wasteDescriptionSchema: FactorySchemaOf<
  BsdaValidationContext,
  WasteDescription
> = context =>
  yup.object({
    wasteCode: yup
      .string()
      .requiredIf(context.emissionSignature, "Le code déchet est obligatoire")
      .oneOf([...WASTES_CODES, "", null], INVALID_WASTE_CODE),
    wasteName: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        "La description déchet est obligatoire"
      ),
    wasteFamilyCode: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        "Le code famille déchet est obligatoire"
      ),
    wasteMaterialName: yup.string().nullable(),
    wasteConsistence: yup
      .mixed<BsdaConsistence>()
      .requiredIf(context.emissionSignature, `La consistence est obligatoire`),
    wasteSealNumbers: yup.array().ensure().of(yup.string()) as any,
    wasteAdr: yup
      .string()
      .requiredIf(context.emissionSignature, "Le code ADR est obligatoire"),
    packagings: yup.array(),
    quantityType: yup
      .mixed<BsdaQuantityType>()
      .requiredIf(
        context.emissionSignature,
        `Le type de quantité est obligatoire`
      ),
    quantityValue: yup
      .number()
      .requiredIf(context.emissionSignature, `La quantité est obligatoire`)
  });
