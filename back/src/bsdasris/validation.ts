import { WasteAcceptationStatus, Prisma } from "@prisma/client";
import { isCollector } from "../companies/validation";
import * as yup from "yup";
import {
  DASRI_WASTE_CODES,
  DASRI_ALL_OPERATIONS_CODES,
  DASRI_PROCESSING_OPERATIONS_CODES,
  DASRI_GROUPING_OPERATIONS_CODES
} from "../common/constants";
import configureYup from "../common/yup/configureYup";
import prisma from "../prisma";
import {
  BsdasriPackagingType,
  BsdasriSignatureType
} from "../generated/graphql/types";

const wasteCodes = DASRI_WASTE_CODES.map(el => el.code);
// set yup default error messages
configureYup();

export type FactorySchemaOf<Context, Type> = (
  context: Context
) => yup.SchemaOf<Type>;

// *************************************************
// BREAK DOWN DASRI TYPE INTO INDIVIDUAL FRAME TYPES
// *************************************************

type Emitter = Pick<
  Prisma.BsdasriCreateInput,
  | "emitterPickupSiteName"
  | "emitterPickupSiteAddress"
  | "emitterPickupSiteCity"
  | "emitterPickupSitePostalCode"
  | "emitterPickupSiteInfos"
  | "emitterCompanyName"
  | "emitterCompanySiret"
  | "emitterCompanyAddress"
  | "emitterCompanyContact"
  | "emitterCompanyPhone"
  | "emitterCompanyMail"
>;
type Emission = Pick<
  Prisma.BsdasriCreateInput,
  | "wasteCode"
  | "wasteAdr"
  | "emitterWasteWeightValue"
  | "emitterWasteWeightIsEstimate"
  | "emitterWastePackagings"
>;
type EcoOrganisme = Pick<
  Prisma.BsdasriCreateInput,
  "ecoOrganismeSiret" | "ecoOrganismeName"
>;
type Transporter = Pick<
  Prisma.BsdasriCreateInput,
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
type Transport = Pick<
  Prisma.BsdasriCreateInput,
  | "transporterAcceptationStatus"
  | "transporterWasteRefusalReason"
  | "transporterWasteRefusedWeightValue"
  | "transporterTakenOverAt"
  | "transporterWastePackagings"
  | "transporterWasteWeightValue"
  | "transporterWasteWeightIsEstimate"
  | "handedOverToRecipientAt"
>;
type Recipient = Pick<
  Prisma.BsdasriCreateInput,
  | "destinationCompanyName"
  | "destinationCompanySiret"
  | "destinationCompanyAddress"
  | "destinationCompanyContact"
  | "destinationCompanyPhone"
  | "destinationCompanyMail"
>;
type Reception = Pick<
  Prisma.BsdasriCreateInput,
  | "destinationWastePackagings"
  | "destinationReceptionAcceptationStatus"
  | "destinationReceptionWasteRefusalReason"
  | "destinationReceptionWasteRefusedWeightValue"
  | "destinationReceptionDate"
>;
type Operation = Pick<
  Prisma.BsdasriCreateInput,
  | "destinationOperationCode"
  | "destinationOperationDate"
  | "destinationReceptionWasteWeightValue"
>;

// *********************
// DASRI ERROR MESSAGES
// *********************

const MISSING_COMPANY_NAME = "Le nom de l'entreprise est obligatoire";
const MISSING_COMPANY_SIRET = "Le siret de l'entreprise est obligatoire";
const MISSING_COMPANY_ADDRESS = "L'adresse de l'entreprise est obligatoire";
const MISSING_COMPANY_CONTACT = "Le contact dans l'entreprise est obligatoire";
const MISSING_COMPANY_PHONE = "Le téléphone de l'entreprise est obligatoire";

const INVALID_SIRET_LENGTH = "Le SIRET doit faire 14 caractères numériques";

const INVALID_DASRI_WASTE_CODE =
  "Ce code déchet n'est pas autorisé pour les DASRI";
const INVALID_PROCESSING_OPERATION =
  "Cette opération d’élimination / valorisation n'existe pas ou n'est pas appropriée";

export const emitterSchema: FactorySchemaOf<
  BsdasriValidationContext,
  Emitter
> = context =>
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
    emitterCompanyMail: yup.string().email().ensure(),

    emitterPickupSiteName: yup.string().nullable(),
    emitterPickupSiteAddress: yup.string().nullable(),
    emitterPickupSiteCity: yup.string().nullable(),
    emitterPickupSitePostalCode: yup.string().nullable(),
    emitterPickupSiteInfos: yup.string().nullable()
  });

const packagingsTypes: BsdasriPackagingType[] = [
  "BOITE_CARTON",
  "FUT",
  "BOITE_PERFORANTS",
  "GRAND_EMBALLAGE",
  "GRV",
  "AUTRE"
];
export const packagingInfo = _ =>
  yup.object({
    type: yup
      .mixed<BsdasriPackagingType>()
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

export const emissionSchema: FactorySchemaOf<
  BsdasriValidationContext,
  Emission
> = context =>
  yup.object({
    wasteCode: yup
      .string()
      .oneOf([...wasteCodes, "", null], INVALID_DASRI_WASTE_CODE)
      .requiredIf(context.emissionSignature, "Le code déchet est obligatoire"),
    wasteAdr: yup
      .string()
      .ensure()
      .requiredIf(context.emissionSignature, `La mention ADR est obligatoire.`),

    emitterWasteWeightValue: yup
      .number()
      .nullable()
      .test(
        "emission-quantity-required-if-type-is-provided",
        "Le poids de déchets émis en kg est obligatoire si vous renseignez le type de pesée",
        function (value) {
          return !!this.parent.emitterWasteWeightIsEstimate ? !!value : true;
        }
      )
      .min(0.1, "Le poids de déchet émis doit être supérieur à 0"),

    emitterWasteWeightIsEstimate: yup
      .boolean()
      .nullable()
      .test(
        "emission-quantity-type-required-if-quantity-is-provided",
        "Le type de pesée (réelle ou estimée) doit être précisé si vous renseignez un poids de déchets émis",
        function (value) {
          return !!this.parent.emitterWasteWeightValue
            ? ![null, undefined].includes(value)
            : true;
        }
      ),

    emitterWastePackagings: yup
      .array()
      .requiredIf(
        context.emissionSignature,
        `Le détail du conditionnement émis est obligatoire.`
      )
      .of(packagingInfo(true))
      .test(
        "packaging-info-required",
        "Le détail du conditionnement émis est obligatoire",
        function (value) {
          return !!context.emissionSignature ? !!value && !!value.length : true;
        }
      )
  });

export const ecoOrganismeSchema: FactorySchemaOf<
  BsdasriValidationContext,
  EcoOrganisme
> = () =>
  yup.object().shape({
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

export const transporterSchema: FactorySchemaOf<
  BsdasriValidationContext,
  Transporter
> = context =>
  yup.object({
    transporterCompanyName: yup
      .string()
      .ensure()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_NAME}`
      ),
    transporterCompanySiret: yup
      .string()
      .length(14, `Transporteur: ${INVALID_SIRET_LENGTH}`)
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_SIRET}`
      ),
    transporterCompanyAddress: yup
      .string()
      .ensure()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_ADDRESS}`
      ),
    transporterCompanyContact: yup
      .string()
      .ensure()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_CONTACT}`
      ),
    transporterCompanyPhone: yup
      .string()
      .ensure()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_PHONE}`
      ),
    transporterCompanyMail: yup.string().email().ensure(),
    transporterRecepisseNumber: yup
      .string()
      .ensure()
      .requiredIf(
        context.transportSignature,
        "Le numéro de récépissé est obligatoire"
      ),

    transporterRecepisseDepartment: yup
      .string()
      .ensure()
      .requiredIf(
        context.transportSignature,
        "Le département du transporteur est obligatoire"
      ),

    transporterRecepisseValidityLimit: yup
      .date()
      .requiredIf(
        context.transportSignature,
        "La date de validité du récépissé est obligatoire"
      )
  });

export const transportSchema: FactorySchemaOf<
  BsdasriValidationContext,
  Transport
> = context =>
  yup.object({
    transporterAcceptationStatus: yup
      .mixed<WasteAcceptationStatus>()
      .requiredIf(
        context.transportSignature,
        "Vous devez préciser si le déchet est accepté"
      ),

    transporterWasteRefusedWeightValue: yup
      .number()
      .when("transporterAcceptationStatus", (type, schema) =>
        ["REFUSED", "PARTIALLY_REFUSED"].includes(type)
          ? schema
              .required("Le poids de déchets refusés doit être précisé.")
              .min(0, "Le poids doit être supérieur à 0")
          : schema
              .nullable()
              .notRequired()
              .test(
                "is-empty",
                "Le champ transporterWasteRefusedWeightValue ne doit pas être renseigné si le déchet est accepté ",
                v => !v
              )
      ),
    transporterWasteRefusalReason: yup
      .string()
      .when("transporterAcceptationStatus", (type, schema) =>
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
    transporterWasteWeightValue: yup
      .number()
      .nullable()
      .test(
        "transport-quantity-required-if-type-is-provided",
        "Le poids de déchets transportés en kg est obligatoire si vous renseignez le type de pesée",
        function (value) {
          return !!this.parent.transporterWasteWeightIsEstimate
            ? !!value
            : true;
        }
      )
      .min(0, "Le poids de déchets transportés doit être supérieur à 0"),

    transporterWasteWeightIsEstimate: yup
      .boolean()
      .nullable()
      .test(
        "emission-quantity-type-required-if-quantity-is-provided",
        "Le type de pesée (réelle ou estimée) doit être précisé si vous renseignez un poids de déchets transportés",
        function (value) {
          return !!this.parent.transporterWasteWeightValue
            ? ![null, undefined].includes(value)
            : true;
        }
      ),

    transporterWastePackagings: yup
      .array()
      .requiredIf(
        context.transportSignature,
        "Le détail du conditionnement est obligatoire"
      )

      .test(
        "packaging-info-required",
        "Le détail du conditionnement transporté est obligatoire",
        function (value) {
          return !!context.transportSignature
            ? !!value && !!value.length
            : true;
        }
      )
      .of(packagingInfo(true)),
    transporterTakenOverAt: yup
      .date()
      .requiredIf(
        context.transportSignature,
        "Le date de prise en charge du déchet est obligatoire"
      ),
    handedOverToRecipientAt: yup.date().nullable() // optional field
  });

export const recipientSchema: FactorySchemaOf<
  BsdasriValidationContext,
  Recipient
> = context =>
  yup.object().shape({
    destinationCompanyName: yup
      .string()
      .requiredIf(
        context.receptionSignature,
        `Destinataire: ${MISSING_COMPANY_NAME}`
      ),
    destinationCompanySiret: yup
      .string()
      .length(14, `Destinataire: ${INVALID_SIRET_LENGTH}`)

      .requiredIf(
        context.receptionSignature,
        `Destinataire: ${MISSING_COMPANY_SIRET}`
      ),
    destinationCompanyAddress: yup
      .string()

      .requiredIf(
        context.receptionSignature,
        `Destinataire: ${MISSING_COMPANY_ADDRESS}`
      ),
    destinationCompanyContact: yup
      .string()

      .requiredIf(
        context.receptionSignature,
        `Destinataire: ${MISSING_COMPANY_CONTACT}`
      ),
    destinationCompanyPhone: yup
      .string()
      .ensure()
      .requiredIf(
        context.receptionSignature,
        `Destinataire: ${MISSING_COMPANY_PHONE}`
      ),
    destinationCompanyMail: yup.string().email().ensure()
  });

export const receptionSchema: FactorySchemaOf<
  BsdasriValidationContext,
  Reception
> = context =>
  yup.object().shape({
    destinationReceptionAcceptationStatus: yup
      .mixed<WasteAcceptationStatus>()
      .requiredIf(
        context.receptionSignature,
        "Vous devez préciser si le déchet est accepté"
      ),
    destinationReceptionWasteRefusedWeightValue: yup
      .number()
      .nullable()
      .notRequired()
      .min(0, "Le poids doit être supérieur à 0"),

    destinationReceptionWasteRefusalReason: yup
      .string()
      .when("destinationReceptionAcceptationStatus", (type, schema) =>
        ["REFUSED", "PARTIALLY_REFUSED"].includes(type)
          ? schema.required("Vous devez saisir un motif de refus")
          : schema
              .nullable()
              .notRequired()
              .test(
                "is-empty",
                "Le champ destinationReceptionWasteRefusalReason ne doit pas être renseigné si le déchet est accepté ",
                v => !v
              )
      ),

    destinationWastePackagings: yup
      .array()
      .requiredIf(
        context.receptionSignature,
        "Le détail du conditionnement est obligatoire"
      )
      .test(
        "packaging-info-required",
        "Le détail du conditionnement reçu est obligatoire",
        function (value) {
          return !!context.receptionSignature
            ? !!value && !!value.length
            : true;
        }
      )
      .of(packagingInfo(true)),
    destinationReceptionDate: yup
      .date()
      .label("Date de réception")
      .nullable()
      .requiredIf(context.receptionSignature)
  });

export const operationSchema: FactorySchemaOf<
  BsdasriValidationContext,
  Operation
> = context => {
  // a grouping dasri should not have a grouping operation code (D12, R12)
  const allowedOperations = context?.isGrouping
    ? DASRI_PROCESSING_OPERATIONS_CODES
    : DASRI_ALL_OPERATIONS_CODES;

  return yup.object({
    destinationReceptionWasteWeightValue: yup
      .number()
      .test(
        "operation-quantity-required-if-final-processing-operation",
        "Le poids du déchet traité en kg est obligatoire si le code correspond à un traitement final",
        function (value) {
          // We do not run this validator until processing signature because fields are not avilable in UI until then
          if (!context.operationSignature) {
            return true;
          }
          return DASRI_PROCESSING_OPERATIONS_CODES.includes(
            this.parent.destinationOperationCode
          )
            ? !!value
            : true;
        }
      )
      .nullable()
      .min(0, "Le poids doit être supérieur à 0"),
    destinationOperationCode: yup
      .string()
      .label("Opération d’élimination / valorisation")
      .oneOf([...allowedOperations, "", null], INVALID_PROCESSING_OPERATION)
      .requiredIf(context.operationSignature)
      .test(
        "recipientIsCollectorForGroupingCodes",
        "Les codes R12 et D12 sont réservés aux installations de tri transit regroupement",
        async (value, ctx) => {
          const recipientSiret = ctx.parent.destinationCompanySiret;

          if (
            DASRI_GROUPING_OPERATIONS_CODES.includes(value) &&
            !!recipientSiret
          ) {
            const destinationCompany = await prisma.company.findUnique({
              where: {
                siret: recipientSiret
              }
            });

            return isCollector(destinationCompany);
          }
          return true;
        }
      ),

    destinationOperationDate: yup
      .date()
      .label("Date de traitement")
      .nullable()
      .requiredIf(context.operationSignature)
  });
};

export type BsdasriValidationContext = {
  emissionSignature?: boolean;
  transportSignature?: boolean;
  receptionSignature?: boolean;
  operationSignature?: boolean;
  isGrouping?: boolean;
};
export function validateBsdasri(
  dasri: Partial<Prisma.BsdasriCreateInput>,
  context: BsdasriValidationContext
) {
  return emitterSchema(context)
    .concat(emissionSchema(context))
    .concat(transporterSchema(context))
    .concat(transportSchema(context))
    .concat(recipientSchema(context))
    .concat(receptionSchema(context))
    .concat(operationSchema(context))
    .concat(ecoOrganismeSchema(context))
    .validate(dasri, { abortEarly: false });
}

/**
 * Filter a strings array according to a same length booleans array.
 * select(["lorem", "ipsum", "dolor", "sit", "amet"], [false, true, false, false, true ])
 * ["ipsum", "amet"]
 */
export const select = (arr: string[], truthTable: boolean[]): string[] =>
  arr.filter((el, idx) => {
    if (truthTable[idx]) return { el };
  });

/**
 * Return wich operation requires the given path to be filled
 */
export const getRequiredFor = (path: string) => {
  const emission = Object.keys(
    emitterSchema({}).concat(emissionSchema({})).describe().fields
  );
  const transport = Object.keys(
    transporterSchema({}).concat(transportSchema({})).describe().fields
  );
  const reception = Object.keys(
    recipientSchema({}).concat(receptionSchema({})).describe().fields
  );

  const operation = Object.keys(operationSchema({}).describe().fields);
  const truthTable = [emission, transport, reception, operation].map(el =>
    el.includes(path)
  );
  const steps = [
    "EMISSION",
    "TRANSPORT",
    "RECEPTION",
    "OPERATION" as BsdasriSignatureType
  ];

  return select(steps, truthTable);
};
