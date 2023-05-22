import {
  Consistence,
  EmitterType,
  Form,
  Prisma,
  QuantityType,
  Status,
  WasteAcceptationStatus
} from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import { Decimal } from "decimal.js-light";
import { checkVAT } from "jsvat";
import countries from "world-countries";
import * as yup from "yup";
import {
  BSDD_APPENDIX1_WASTE_CODES,
  BSDD_WASTE_CODES,
  isDangerous,
  PROCESSING_AND_REUSE_OPERATIONS_CODES,
  PROCESSING_OPERATIONS_CODES,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES
} from "../common/constants";
import {
  BAD_CHARACTERS_REGEXP,
  countries as vatCountries,
  isForeignVat,
  isOmi,
  isSiret,
  isVat
} from "../common/constants/companySearchHelpers";
import {
  foreignVatNumber,
  siret,
  siretConditions,
  siretTests,
  vatNumber,
  vatNumberTests,
  weight,
  weightConditions,
  WeightUnits
} from "../common/validation";
import configureYup, { FactorySchemaOf } from "../common/yup/configureYup";
import {
  InitialFormFractionInput,
  PackagingInfo,
  Packagings
} from "../generated/graphql/types";
import prisma from "../prisma";
import {
  EXTRANEOUS_NEXT_DESTINATION,
  INVALID_COMPANY_OMI_NUMBER,
  INVALID_INDIVIDUAL_OR_FOREIGNSHIP,
  INVALID_PROCESSING_OPERATION,
  INVALID_WASTE_CODE,
  MISSING_COMPANY_ADDRESS,
  MISSING_COMPANY_CONTACT,
  MISSING_COMPANY_EMAIL,
  MISSING_COMPANY_NAME,
  MISSING_COMPANY_OMI_NUMBER,
  MISSING_COMPANY_PHONE,
  MISSING_COMPANY_SIRET,
  MISSING_COMPANY_SIRET_OR_VAT,
  MISSING_PROCESSING_OPERATION
} from "./errors";
import { format, sub } from "date-fns";
// set yup default error messages
configureYup();

// ************************************************
// BREAK DOWN FORM TYPE INTO INDIVIDUAL FRAME TYPES
// ************************************************

type Emitter = Pick<
  Prisma.FormCreateInput,
  | "emitterType"
  | "emitterPickupSite"
  | "emitterIsPrivateIndividual"
  | "emitterIsForeignShip"
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
  | "emitterCompanyOmiNumber"
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

type WasteDetailsCommon = Pick<
  Prisma.FormCreateInput,
  | "wasteDetailsName"
  | "wasteDetailsCode"
  | "wasteDetailsIsDangerous"
  | "wasteDetailsName"
  | "wasteDetailsCode"
  | "wasteDetailsIsDangerous"
  | "wasteDetailsOnuCode"
  | "wasteDetailsParcelNumbers"
  | "wasteDetailsAnalysisReferences"
  | "wasteDetailsLandIdentifiers"
  | "wasteDetailsConsistence"
>;

type WasteDetailsAppendix1 = WasteDetailsCommon;

type WasteDetails = WasteDetailsCommon &
  Pick<
    Prisma.FormCreateInput,
    | "wasteDetailsPackagingInfos"
    | "wasteDetailsQuantity"
    | "wasteDetailsQuantityType"
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
  | "transporterCompanyVatNumber"
>;

type Trader = Pick<
  Prisma.FormCreateInput,
  | "traderCompanyName"
  | "traderCompanySiret"
  | "traderCompanyAddress"
  | "traderCompanyContact"
  | "traderCompanyPhone"
  | "traderCompanyMail"
  | "traderReceipt"
  | "traderDepartment"
  | "traderValidityLimit"
>;

type Broker = Pick<
  Prisma.FormCreateInput,
  | "brokerCompanyName"
  | "brokerCompanySiret"
  | "brokerCompanyAddress"
  | "brokerCompanyContact"
  | "brokerCompanyPhone"
  | "brokerCompanyMail"
  | "brokerReceipt"
  | "brokerDepartment"
  | "brokerValidityLimit"
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
  | "nextDestinationCompanyVatNumber"
  | "nextDestinationNotificationNumber"
>;

// Context used to determine if some fields are required or not
type FormValidationContext = {
  isDraft: boolean;
  transporterSignature: boolean;
};

export const hasPipeline = (value: {
  wasteDetailsPackagingInfos: Array<{
    type: Packagings;
  }>;
}): boolean =>
  value.wasteDetailsPackagingInfos?.some(i => i.type === "PIPELINE");

// *************************************************************
// DEFINES VALIDATION SCHEMA FOR INDIVIDUAL FRAMES IN BSD PAGE 1
// *************************************************************

// 1 - Émetteur du bordereau
const emitterSchemaFn: FactorySchemaOf<FormValidationContext, Emitter> = ({
  isDraft
}) =>
  yup.object({
    emitterPickupSite: yup.string().nullable(),
    emitterWorkSiteAddress: yup.string().nullable(),
    emitterWorkSiteCity: yup.string().nullable(),
    emitterWorkSiteInfos: yup.string().nullable(),
    emitterWorkSiteName: yup.string().nullable(),
    emitterWorkSitePostalCode: yup.string().nullable(),
    emitterType: yup
      .mixed<EmitterType>()
      .when("ecoOrganismeSiret", {
        is: ecoOrganismeSiret => !ecoOrganismeSiret,
        then: yup
          .mixed()
          .requiredIf(!isDraft, `Émetteur: Le type d'émetteur est obligatoire`)
      })
      .when("emitterIsPrivateIndividual", {
        is: emitterIsPrivateIndividual => !emitterIsPrivateIndividual,
        then: yup
          .mixed()
          .requiredIf(!isDraft, `Émetteur: Le type d'émetteur est obligatoire`),
        otherwise: yup
          .mixed()
          .oneOf(
            ["PRODUCER", "APPENDIX1_PRODUCER"],
            `Émetteur: Le type d'émetteur doit être "PRODUCER" ou "APPENDIX1_PRODUCER" lorsque l'émetteur est un particulier`
          )
      })
      .when("emitterIsForeignShip", {
        is: emitterIsForeignShip => !emitterIsForeignShip,
        then: yup
          .mixed()
          .requiredIf(!isDraft, `Émetteur: Le type d'émetteur est obligatoire`),
        otherwise: yup
          .mixed()
          .oneOf(
            ["PRODUCER"],
            `Émetteur: Le type d'émetteur doit être "PRODUCER" lorsque l'émetteur est un navire étranger`
          )
      }),
    emitterCompanyName: yup
      .string()
      .ensure()
      .when("emitterIsForeignShip", (emitterIsForeignShip, schema) =>
        emitterIsForeignShip === true ? schema.notRequired() : schema
      )
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_NAME}`),
    emitterCompanySiret: siret
      .label("Émetteur")
      .when("emitterIsForeignShip", siretConditions.isForeignShip)
      .when("emitterIsPrivateIndividual", siretConditions.isPrivateIndividual)
      .when(["emitterIsForeignShip", "emitterIsPrivateIndividual"], {
        is: (isForeignShip: boolean, isPrivateIndividual: boolean) =>
          !isForeignShip && !isPrivateIndividual,
        then: schema =>
          schema.requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_SIRET}`)
      }),
    emitterCompanyAddress: yup
      .string()
      .ensure()
      .when("emitterIsForeignShip", (emitterIsForeignShip, schema) =>
        emitterIsForeignShip === true ? schema.notRequired() : schema
      )
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_ADDRESS}`),
    emitterCompanyContact: yup
      .string()
      .ensure()
      .when("emitterIsForeignShip", (emitterIsForeignShip, schema) =>
        emitterIsForeignShip === true ? schema.notRequired() : schema
      )
      .when(
        "emitterIsPrivateIndividual",
        (emitterIsPrivateIndividual, schema) =>
          emitterIsPrivateIndividual === true ? schema.notRequired() : schema
      )
      .test(
        "company-contact-with-private",
        "Émetteur: vous ne pouvez pas enregistrer une personne contact en cas d'émetteur particulier",
        function (value) {
          const { emitterIsPrivateIndividual } = this.parent;
          if (emitterIsPrivateIndividual === true && value) {
            return false;
          }
          return true;
        }
      )
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_CONTACT}`),
    emitterCompanyPhone: yup
      .string()
      .ensure()
      .when("emitterIsForeignShip", (emitterIsForeignShip, schema) =>
        emitterIsForeignShip === true ? schema.notRequired() : schema
      )
      .when(
        "emitterIsPrivateIndividual",
        (emitterIsPrivateIndividual, schema) =>
          emitterIsPrivateIndividual === true ? schema.notRequired() : schema
      )
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_PHONE}`),
    emitterCompanyMail: yup
      .string()
      .email()
      .ensure()
      .when("emitterIsForeignShip", (emitterIsForeignShip, schema) =>
        emitterIsForeignShip === true ? schema.notRequired() : schema
      )
      .when(
        "emitterIsPrivateIndividual",
        (emitterIsPrivateIndividual, schema) =>
          emitterIsPrivateIndividual === true ? schema.notRequired() : schema
      )
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_EMAIL}`),
    emitterCompanyOmiNumber: yup
      .string()
      .nullable()
      .notRequired()
      .test(
        "omi-but-private",
        `Émetteur: Impossible de définir un  numéro OMI avec un émetteur particulier`,
        function (value) {
          const { emitterIsPrivateIndividual } = this.parent;
          if (emitterIsPrivateIndividual === true && !!value) {
            return false;
          }
          return true;
        }
      )
      .test(
        "omi-absent-with-foreign-ship",
        `Émetteur: ${MISSING_COMPANY_OMI_NUMBER}`,
        function (value) {
          const { emitterIsForeignShip } = this.parent;
          if (emitterIsForeignShip === true && !value) {
            return false;
          }
          return true;
        }
      )
      .test(
        "omi-invalid-with-foreign-ship",
        `Émetteur: ${INVALID_COMPANY_OMI_NUMBER}`,
        function (value) {
          const { emitterIsForeignShip } = this.parent;
          if (emitterIsForeignShip === true && !isOmi(value)) {
            return false;
          }
          return true;
        }
      )
      .test(
        "omi-defined-but-not-foreign-ship",
        `Émetteur: Impossible de définir un  numéro OMI sans un émetteur navire étranger`,
        function (value) {
          const { emitterIsForeignShip } = this.parent;
          if (!emitterIsForeignShip && !!value) {
            return false;
          }
          return true;
        }
      ),
    emitterIsPrivateIndividual: yup
      .boolean()
      .nullable()
      .notRequired()
      .test(
        "is-private-exclusive",
        `Émetteur: ${INVALID_INDIVIDUAL_OR_FOREIGNSHIP}`,
        function (value) {
          const { emitterIsForeignShip } = this.parent;
          return !(value === true && emitterIsForeignShip === true);
        }
      ),
    emitterIsForeignShip: yup
      .boolean()
      .nullable()
      .notRequired()
      .test(
        "is-foreign-ship-exclusive",
        `Émetteur: ${INVALID_INDIVIDUAL_OR_FOREIGNSHIP}`,
        function (value) {
          const { emitterIsPrivateIndividual } = this.parent;
          return !(value === true && emitterIsPrivateIndividual === true);
        }
      )
  });

// Optional validation schema for eco-organisme appearing in frame 1
export const ecoOrganismeSchema = yup.object().shape({
  ecoOrganismeSiret: siret
    .label("Éco-organisme")
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
const recipientSchemaFn: FactorySchemaOf<FormValidationContext, Recipient> = ({
  isDraft
}) =>
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
            rootValue?.wasteDetailsIsDangerous &&
            !value &&
            rootValue?.emitterType !== EmitterType.APPENDIX1
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
      .requiredIf(!isDraft)
      .when("emitterType", (value, schema) => {
        const oneOf =
          value === EmitterType.APPENDIX2
            ? [
                ...PROCESSING_AND_REUSE_OPERATIONS_CODES,
                ...PROCESSING_AND_REUSE_OPERATIONS_CODES.map(c =>
                  c.replace(" ", "")
                )
              ]
            : [
                ...PROCESSING_OPERATIONS_CODES,
                ...PROCESSING_OPERATIONS_CODES.map(c => c.replace(" ", ""))
              ];

        return schema.oneOf(
          ["", ...oneOf],
          `Destination : ${INVALID_PROCESSING_OPERATION}`
        );
      }),
    recipientCompanyName: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_NAME}`),
    recipientCompanySiret: siret
      .label("Destinataire")
      .test(siretTests.isRegistered("DESTINATION"))
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_SIRET}`),
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

export const packagingInfoFn = ({
  isDraft
}: Pick<FormValidationContext, "isDraft">) =>
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

const parcelCommonInfos = yup
  .object({
    city: yup.string().required("Parcelle: la ville est obligatoire"),
    postalCode: yup
      .string()
      .required("Parcelle: le code postal est obligatoire")
  })
  .test(
    "no-unknown",
    "Parcelle: impossible d'avoir à la fois des coordonnées GPS et un numéro de parcelle",
    (value, testContext) => {
      const { fields } = testContext.schema;
      const known = Object.keys(fields);
      const unknownKeys: string[] = Object.keys(value || {}).filter(
        key => known.indexOf(key) === -1
      );

      return unknownKeys.every(key => value[key] == null);
    }
  );
const parcelNumber = yup.object({
  prefix: yup
    .string()
    .min(1)
    .max(5)
    .required("Parcelle: le préfixe est obligatoire"),
  section: yup
    .string()
    .min(1)
    .max(5)
    .required("Parcelle: la section est obligatoire"),
  number: yup
    .string()
    .min(1)
    .max(5)
    .required("Parcelle: le numéro de parcelle est obligatoire")
});
const parcelCoordinates = yup.object({
  x: yup.number().required("Parcelle: la coordonnée X est obligatoire"),
  y: yup.number().required("Parcelle: la coordonnée Y est obligatoire")
});
const parcelInfos = yup.lazy(value => {
  if (value.prefix || value.section || value.number) {
    return parcelCommonInfos.concat(parcelNumber);
  }
  return parcelCommonInfos.concat(parcelCoordinates);
});

// 3 - Dénomination du déchet
// 4 - Mentions au titre des règlements ADR, RID, ADNR, IMDG
// 5 - Conditionnement
// 6 - Quantité
const baseWasteDetailsSchemaFn: FactorySchemaOf<
  Pick<FormValidationContext, "isDraft">,
  WasteDetailsCommon
> = ({ isDraft }) =>
  yup.object({
    wasteDetailsCode: yup
      .string()
      .requiredIf(!isDraft, "Le code déchet est obligatoire")
      .oneOf([...BSDD_WASTE_CODES, "", null], INVALID_WASTE_CODE),
    wasteDetailsName: yup
      .string()
      .requiredIf(!isDraft, "L'appellation du déchet est obligatoire."),
    wasteDetailsIsDangerous: yup.boolean().when("wasteDetailsCode", {
      is: (wasteCode: string) => isDangerous(wasteCode || ""),
      then: () =>
        yup
          .boolean()
          .isTrue(
            `Un déchet avec un code comportant un astérisque est forcément dangereux`
          ),
      otherwise: () => yup.boolean()
    }),
    wasteDetailsOnuCode: yup.string().when("wasteDetailsIsDangerous", {
      is: (wasteDetailsIsDangerous: boolean) =>
        wasteDetailsIsDangerous === true,
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
    wasteDetailsParcelNumbers: yup.array().of(parcelInfos as any),
    wasteDetailsAnalysisReferences: yup.array().of(yup.string()) as any,
    wasteDetailsLandIdentifiers: yup.array().of(yup.string()) as any,
    wasteDetailsConsistence: yup
      .mixed<Consistence>()
      .requiredIf(!isDraft, "La consistance du déchet doit être précisée")
  });

// Schéma lorsque emitterType = APPENDIX1
const wasteDetailsAppendix1SchemaFn: FactorySchemaOf<
  Pick<FormValidationContext, "isDraft">,
  WasteDetailsAppendix1
> = ({ isDraft }) =>
  baseWasteDetailsSchemaFn({ isDraft }).concat(
    yup.object({
      wasteDetailsName: yup.string().nullable(),
      wasteDetailsCode: yup
        .string()
        .requiredIf(!isDraft, "Le code déchet est obligatoire")
        .oneOf(
          [...BSDD_APPENDIX1_WASTE_CODES, "", null],
          "Le code déchet n'est pas utilisable sur une annexe 1."
        )
    })
  );

// Schéma lorsque emitterType n'est pas APPENDIX1
const wasteDetailsNormalSchemaFn: FactorySchemaOf<
  Pick<FormValidationContext, "isDraft">,
  WasteDetails
> = ({ isDraft }) =>
  baseWasteDetailsSchemaFn({ isDraft }).concat(
    yup.object({
      wasteDetailsPackagingInfos: yup
        .array()
        .requiredIf(!isDraft, "Le détail du conditionnement est obligatoire")
        .of(packagingInfoFn({ isDraft }) as any)
        .test(
          "is-valid-packaging-infos",
          "${path} ne peut pas à la fois contenir 1 citerne, 1 pipeline ou 1 benne et un autre conditionnement.",
          (infos: PackagingInfo[] | undefined) => {
            const hasCiterne = infos?.some(i => i.type === "CITERNE");
            const hasPipeline = infos?.some(i => i.type === "PIPELINE");
            const hasBenne = infos?.some(i => i.type === "BENNE");

            if (
              // citerne and benne together are not allowed
              (hasCiterne && hasBenne) ||
              // pipeline and any other Packaging is forbidden
              (infos?.some(i => i.type !== "PIPELINE") && hasPipeline)
            ) {
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
      wasteDetailsQuantity: weight(WeightUnits.Tonne)
        .label("Déchet")
        .when(
          ["transporterTransportMode", "createdAt"],
          weightConditions.transportMode(WeightUnits.Tonne)
        )
        .requiredIf(
          !isDraft,
          "La quantité du déchet en tonnes est obligatoire"
        ),
      wasteDetailsQuantityType: yup
        .mixed<QuantityType>()
        .requiredIf(
          !isDraft,
          "Le type de quantité (réelle ou estimée) doit être précisé"
        ),
      wasteDetailsPop: yup
        .boolean()
        .requiredIf(!isDraft, "La présence (ou non) de POP doit être précisée")
    })
  );

const wasteDetailsSchemaFn = (
  context: Pick<FormValidationContext, "isDraft">
) =>
  yup.lazy(value => {
    if (value.emitterType === EmitterType.APPENDIX1_PRODUCER) {
      return yup.object();
    }

    if (value.emitterType === EmitterType.APPENDIX1) {
      return wasteDetailsAppendix1SchemaFn(context);
    }
    return wasteDetailsNormalSchemaFn(context);
  });

// 8 - Collecteur-transporteur
export const transporterSchemaFn: FactorySchemaOf<
  Pick<FormValidationContext, "transporterSignature">,
  Transporter
> = ({ transporterSignature }) =>
  yup.object({
    transporterCustomInfo: yup.string().nullable(),
    transporterNumberPlate: yup.string().nullable(),
    transporterCompanyName: yup
      .string()
      .ensure()
      .requiredIf(
        transporterSignature,
        `Transporteur: ${MISSING_COMPANY_NAME}`
      ),
    transporterCompanySiret: siret
      .label("Transporteur")
      .test(siretTests.isRegistered("TRANSPORTER"))
      .when(
        "transporterCompanyVatNumber",
        // set siret not required when vatNumber is defined and valid
        siretConditions.companyVatNumber
      )
      .requiredIf(
        transporterSignature,
        `Transporteur : ${MISSING_COMPANY_SIRET_OR_VAT}`
      ),
    transporterCompanyVatNumber: foreignVatNumber
      .label("Transporteur")
      .test(vatNumberTests.isRegisteredTransporter),
    transporterCompanyAddress: yup
      .string()
      .ensure()
      .requiredIf(
        transporterSignature,
        `Transporteur: ${MISSING_COMPANY_ADDRESS}`
      ),
    transporterCompanyContact: yup
      .string()
      .ensure()
      .requiredIf(
        transporterSignature,
        `Transporteur: ${MISSING_COMPANY_CONTACT}`
      ),
    transporterCompanyPhone: yup
      .string()
      .ensure()
      .requiredIf(
        transporterSignature,
        `Transporteur: ${MISSING_COMPANY_PHONE}`
      ),
    transporterCompanyMail: yup
      .string()
      .email()
      .ensure()
      .requiredIf(
        transporterSignature,
        `Transporteur: ${MISSING_COMPANY_EMAIL}`
      ),
    transporterIsExemptedOfReceipt: yup.boolean().notRequired().nullable(),
    transporterReceipt: yup
      .string()
      .when(["transporterIsExemptedOfReceipt", "transporterCompanyVatNumber"], {
        is: (isExempted, vat) => isForeignVat(vat) || isExempted,
        then: schema => schema.notRequired().nullable(),
        otherwise: schema =>
          schema.requiredIf(
            transporterSignature,
            "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
          )
      }),
    transporterDepartment: yup
      .string()
      .when(["transporterIsExemptedOfReceipt", "transporterCompanyVatNumber"], {
        is: (isExempted, vat) => isForeignVat(vat) || isExempted,
        then: schema => schema.notRequired().nullable(),
        otherwise: schema =>
          schema.requiredIf(
            transporterSignature,
            "Le département du transporteur est obligatoire"
          )
      }),
    transporterValidityLimit: yup.date().nullable()
  });

// 8 - Collecteur-transporteur vide dans le cas du pipeline
export const emptyTransporterSchema: yup.SchemaOf<Transporter> = yup.object({
  transporterCustomInfo: yup.string().nullable().oneOf([null, ""]),
  transporterNumberPlate: yup.string().nullable().oneOf([null, ""]),
  transporterCompanyName: yup.string().nullable().oneOf([null, ""]),
  transporterCompanySiret: yup.string().nullable().oneOf([null, ""]),
  transporterCompanyVatNumber: yup.string().nullable().oneOf([null, ""]),
  transporterCompanyAddress: yup.string().nullable().oneOf([null, ""]),
  transporterCompanyContact: yup.string().nullable().oneOf([null, ""]),
  transporterCompanyPhone: yup.string().nullable().oneOf([null, ""]),
  transporterCompanyMail: yup.string().nullable().oneOf([null, ""]),
  transporterIsExemptedOfReceipt: yup.boolean().notRequired().nullable(),
  transporterReceipt: yup.string().nullable().oneOf([null, ""]),
  transporterDepartment: yup.string().nullable().oneOf([null, ""]),
  transporterValidityLimit: yup.string().nullable().oneOf([null, ""])
});

export const traderSchemaFn: FactorySchemaOf<FormValidationContext, Trader> = ({
  isDraft
}) =>
  yup.object({
    traderCompanySiret: siret.label("Négociant"),
    traderCompanyName: yup.string().when("traderCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_NAME}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    traderCompanyAddress: yup.string().when("traderCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_ADDRESS}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    traderCompanyContact: yup.string().when("traderCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_CONTACT}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    traderCompanyPhone: yup.string().when("traderCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_PHONE}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    traderCompanyMail: yup
      .string()
      .email()
      .when("traderCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_EMAIL}`),
        otherwise: schema => schema.notRequired().nullable()
      }),
    traderReceipt: yup.string().when("traderCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, "Négociant: Numéro de récepissé obligatoire"),
      otherwise: schema => schema.notRequired().nullable()
    }),
    traderDepartment: yup.string().when("traderCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, "Négociant : Département obligatoire"),
      otherwise: schema => schema.notRequired().nullable()
    }),
    traderValidityLimit: yup.date().when("traderCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema.requiredIf(!isDraft, "Négociant : Date de validité obligatoire"),
      otherwise: schema => schema.notRequired().nullable()
    })
  });

export const brokerSchemaFn: FactorySchemaOf<FormValidationContext, Broker> = ({
  isDraft
}) =>
  yup.object({
    brokerCompanySiret: siret.label("Courtier"),
    brokerCompanyName: yup.string().when("brokerCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_NAME}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerCompanyAddress: yup.string().when("brokerCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_ADDRESS}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerCompanyContact: yup.string().when("brokerCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_CONTACT}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerCompanyPhone: yup.string().when("brokerCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_PHONE}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerCompanyMail: yup.string().when("brokerCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_EMAIL}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerReceipt: yup.string().when("brokerCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, "Courtier : Numéro de récepissé obligatoire"),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerDepartment: yup.string().when("brokerCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, "Courtier : Département obligatoire"),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerValidityLimit: yup.date().when("brokerCompanySiret", {
      is: siret => !!siret,
      then: schema =>
        schema.requiredIf(!isDraft, "Courtier : Date de validité obligatoire"),
      otherwise: schema => schema.notRequired().nullable()
    })
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
  quantityReceived: weight(WeightUnits.Tonne)
    .label("Réception")
    .when("wasteAcceptationStatus", weightConditions.wasteAcceptationStatus)
    .when(
      "transporterTransportMode",
      weightConditions.transportMode(WeightUnits.Tonne)
    ),
  wasteAcceptationStatus: yup
    .mixed<WasteAcceptationStatus>()
    .test(
      "is-not-partial-on-appendix1",
      "Impossible de faire une acceptation partielle sur un bordereau de tournée",
      (value, context) => {
        const emitterType = context.parent.emitterType;
        return (
          emitterType !== EmitterType.APPENDIX1 ||
          value !== WasteAcceptationStatus.PARTIALLY_REFUSED
        );
      }
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

// 10 - Expédition acceptée (ou refusée) à l’installation de destination
export const acceptedInfoSchema: yup.SchemaOf<AcceptedInfo> = yup.object({
  isAccepted: yup.boolean(),
  signedAt: yup.date().nullable(),
  signedBy: yup
    .string()
    .ensure()
    .required("Vous devez saisir un responsable de la réception."),
  quantityReceived: weight(WeightUnits.Tonne)
    .label("Réception")
    .required("${path} : Le poids reçu en tonnes est obligatoire")
    .when(
      "wasteAcceptationStatus",
      weightConditions.wasteAcceptationStatus as any
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

const withNextDestination = (required: boolean) =>
  yup.object().shape({
    nextDestinationProcessingOperation: yup
      .string()
      .required(`Destination ultérieure : ${MISSING_PROCESSING_OPERATION}`)
      .oneOf(
        PROCESSING_AND_REUSE_OPERATIONS_CODES,
        `Destination ultérieure : ${INVALID_PROCESSING_OPERATION}`
      ),
    nextDestinationCompanyName: yup
      .string()
      .ensure()
      .requiredIf(required, `Destination ultérieure : ${MISSING_COMPANY_NAME}`),
    nextDestinationCompanySiret: siret
      .label("Destination ultérieure prévue")
      .when("nextDestinationCompanyVatNumber", (vat, schema) => {
        return !isVat(vat) && required
          ? schema.required(
              `Destination ultérieure prévue : ${MISSING_COMPANY_SIRET}`
            )
          : schema.notRequired().nullable();
      }),
    nextDestinationCompanyVatNumber: vatNumber.label(
      "Destination ultérieure prévue"
    ),
    nextDestinationCompanyAddress: yup
      .string()
      .ensure()
      .requiredIf(
        required,
        `Destination ultérieure : ${MISSING_COMPANY_ADDRESS}`
      ),
    nextDestinationCompanyCountry: yup
      .string()
      .ensure()
      .oneOf(
        ["", ...countries.map(country => country.cca2)],
        "Destination ultérieure : le code ISO 3166-1 alpha-2 du pays de l'entreprise n'est pas reconnu"
      )
      .when("nextDestinationCompanyVatNumber", (vat, schema) => {
        return isVat(vat) && required
          ? schema.test(
              "is-country-valid",
              "Destination ultérieure : le code du pays de l'entreprise ne correspond pas au numéro de TVA entré",
              value =>
                !value ||
                checkVAT(vat.replace(BAD_CHARACTERS_REGEXP, ""), vatCountries)
                  ?.country?.isoCode.short ===
                  value.replace(BAD_CHARACTERS_REGEXP, "")
            )
          : schema;
      })
      .when("nextDestinationCompanySiret", (siret, schema) => {
        return isSiret(siret) && required
          ? schema.test(
              "is-fr-country-valid",
              "Destination ultérieure : le code du pays de l'entreprise ne peut pas être différent de FR",
              value => !value || value === "FR"
            )
          : schema;
      }),
    nextDestinationCompanyContact: yup
      .string()
      .ensure()
      .requiredIf(
        required,
        `Destination ultérieure : ${MISSING_COMPANY_CONTACT}`
      ),
    nextDestinationCompanyPhone: yup
      .string()
      .ensure()
      .requiredIf(
        required,
        `Destination ultérieure : ${MISSING_COMPANY_PHONE}`
      ),
    nextDestinationCompanyMail: yup
      .string()
      .email()
      .ensure()
      .requiredIf(
        required,
        `Destination ultérieure : ${MISSING_COMPANY_EMAIL}`
      ),
    nextDestinationNotificationNumber: yup
      .string()
      .notRequired()
      .nullable()
      .matches(
        /^[a-zA-Z]{2}[0-9]{4}$|^$/,
        "Destination ultérieure : Le numéro d'identication ou de document doit être composé de 2 lettres (code pays) puis 4 chiffres (numéro d'ordre)"
      )
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
  nextDestinationCompanyVatNumber: yup
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
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  nextDestinationNotificationNumber: yup
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
      .oneOf(
        PROCESSING_AND_REUSE_OPERATIONS_CODES,
        INVALID_PROCESSING_OPERATION
      ),
    processingOperationDescription: yup.string().nullable()
  });

  if (
    PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(
      value?.processingOperationDone
    )
  ) {
    if (value?.noTraceability === true) {
      return base
        .concat(withNextDestination(false))
        .concat(traceabilityBreakAllowed);
    }
    return base
      .concat(withNextDestination(true))
      .concat(traceabilityBreakAllowed);
  } else {
    return base
      .concat(withoutNextDestination)
      .concat(traceabilityBreakForbidden);
  }
};

export const processedInfoSchema = yup.lazy(processedInfoSchemaFn);

// *******************************************************************
// COMPOSE VALIDATION SCHEMAS TO VALIDATE A FORM FOR A SPECIFIC STATUS
// *******************************************************************

// validation schema for BSD before it can be sealed
const baseFormSchemaFn = (context: FormValidationContext) =>
  yup.lazy(value => {
    if (value.emitterType === EmitterType.APPENDIX1_PRODUCER) {
      return emitterSchemaFn(context).noUnknown();
    }

    const lazyWasteDetailsSchema = wasteDetailsSchemaFn(context).resolve({
      value
    });

    if (hasPipeline(value)) {
      return yup
        .object()
        .concat(emitterSchemaFn(context))
        .concat(ecoOrganismeSchema)
        .concat(recipientSchemaFn(context))
        .concat(emptyTransporterSchema)
        .concat(traderSchemaFn(context))
        .concat(brokerSchemaFn(context))
        .concat(lazyWasteDetailsSchema);
    }

    return yup
      .object()
      .concat(emitterSchemaFn(context))
      .concat(ecoOrganismeSchema)
      .concat(recipientSchemaFn(context))
      .concat(transporterSchemaFn(context))
      .concat(traderSchemaFn(context))
      .concat(brokerSchemaFn(context))
      .concat(lazyWasteDetailsSchema);
  });
export const sealedFormSchema = baseFormSchemaFn({
  isDraft: false,
  transporterSignature: false
});
export const draftFormSchema = baseFormSchemaFn({
  isDraft: true,
  transporterSignature: false
});
export const wasteDetailsSchema = wasteDetailsSchemaFn({
  isDraft: false
});

export const beforeTransportSchema = yup.lazy(value => {
  const lazyWasteDetailsSchema = wasteDetailsSchemaFn({
    isDraft: false
  }).resolve({
    value
  });
  return yup
    .object()
    .concat(transporterSchemaFn({ transporterSignature: true }))
    .concat(lazyWasteDetailsSchema);
});

export async function validateBeforeTransport(form: Form) {
  await beforeTransportSchema.validate(form, { abortEarly: false });

  if (form.emitterType !== "APPENDIX1_PRODUCER") {
    // Vérifie qu'au moins un packaging a été déini sauf dans le cas
    // d'un bordereau d'annexe 1 pour lequel il est possible de ne pas définir
    // de packaging
    const wasteDetailsBeforeTransportSchema = yup.object({
      wasteDetailsPackagingInfos: yup
        .array()
        .min(1, "Le nombre de contenants doit être supérieur à 0")
    });
    await wasteDetailsBeforeTransportSchema.validate(form);
  }
  return form;
}

// validation schema for a BSD with a processed status
export const processedFormSchema = yup.lazy((value: any) =>
  sealedFormSchema
    .resolve({ value })
    .concat(transporterSchemaFn({ transporterSignature: true }))
    .concat(signingInfoSchema)
    .concat(receivedInfoSchema)
    .concat(processedInfoSchemaFn(value))
);

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
 * Check that the n°SIRET appearing on the forwardedIn form match existing
 * companies registered in Trackdechets and that their profile
 * is consistent with the role they play on the form
 * (producer, trader, destination, etc)
 */
export async function validateForwardedInCompanies(form: Form): Promise<void> {
  const forwardedIn = await prisma.form
    .findUnique({ where: { id: form.id } })
    .forwardedIn();

  if (forwardedIn?.recipientCompanySiret) {
    await siret
      .label("Destination finale")
      .test(siretTests.isRegistered("DESTINATION"))
      .validate(forwardedIn.recipientCompanySiret);
  }
  if (forwardedIn?.transporterCompanySiret) {
    await siret
      .label("Transporteur après entreposage provisoire")
      .test(siretTests.isRegistered("TRANSPORTER"))
      .validate(forwardedIn.transporterCompanySiret);
  }
  if (forwardedIn?.transporterCompanyVatNumber) {
    await foreignVatNumber
      .label("Transporteur après entreposage provisoire")
      .test(vatNumberTests.isRegisteredTransporter)
      .validate(forwardedIn?.transporterCompanyVatNumber);
  }
}

const BSDD_MAX_APPENDIX2 = parseInt(process.env.BSDD_MAX_APPENDIX2!, 10) || 250;

/**
 * Les vérifications suivantes sont effectuées :
 * - Vérifie que le type d'émetteur est compatible avec le groupement
 * - Vérifie que le SIRET de l'établissement émetteur est renseigné et qu'il correspond
 * au SIRET de destination des BSDD initiaux
 * - Vérifie que les identifiants des BSDD initiaux existent
 * - Vérifie que les BSDD initiaux sont bien en attente de regroupement
 * - Vérifie que les quantités à regrouper son cohérentes
 */
export async function validateGroupement(
  form: Partial<Form | Prisma.FormCreateInput>,
  grouping: InitialFormFractionInput[]
): Promise<
  {
    form: Form;
    quantity: number;
  }[]
> {
  if (!grouping || grouping?.length === 0) {
    return [];
  }

  if (form.emitterType === EmitterType.APPENDIX2) {
    return validateAppendix2Groupement(form, grouping);
  }

  if (form.emitterType === EmitterType.APPENDIX1) {
    return validateAppendix1Groupement(form, grouping);
  }

  throw new UserInputError(
    "emitter.type doit être égal à APPENDIX2 ou APPENDIX1 lorsque `appendix2Forms` ou `grouping` n'est pas vide"
  );
}

export async function validateAppendix2Groupement(
  form: Partial<Form | Prisma.FormCreateInput>,
  grouping: InitialFormFractionInput[]
) {
  if (grouping.length > BSDD_MAX_APPENDIX2) {
    throw new UserInputError(
      `Vous ne pouvez pas regrouper plus de ${BSDD_MAX_APPENDIX2} BSDDs initiaux`
    );
  }

  if (!form.emitterCompanySiret) {
    throw new UserInputError(
      "Vous devez renseigner le numéro SIRET de l'établissement de tri, transit, regroupement émettrice du BSDD de regroupement"
    );
  }

  // check each form appears in only one form fraction
  const formIds = grouping.map(({ form }) => form.id);
  const duplicates = formIds.filter(
    (id, index) => formIds.indexOf(id) !== index
  );
  if (duplicates.length > 0) {
    throw new UserInputError(
      `Impossible d'associer plusieurs fractions du même bordereau initial sur un même bordereau` +
        ` de regroupement. Identifiant du ou des bordereaux initiaux concernés : ${duplicates.join(
          ", "
        )}`
    );
  }

  const initialForms = await prisma.form.findMany({
    where: {
      id: { in: grouping.map(({ form }) => form.id) },
      status: { in: [Status.AWAITING_GROUP, Status.GROUPED] }
    },
    include: {
      forwardedIn: {
        select: { recipientCompanySiret: true, quantityReceived: true }
      },
      groupedIn: true
    }
  });

  if (grouping.length > 0 && initialForms.length < grouping.length) {
    const notFoundIds = grouping
      .map(({ form }) => form.id)
      .filter(id => !initialForms.map(p => p.id).includes(id));
    throw new UserInputError(
      `Les BSDD initiaux ${notFoundIds.join(
        ", "
      )} n'existent pas ou ne sont pas en attente de regroupement`
    );
  }

  const formFractions = initialForms.map(f => {
    if (!f.quantityReceived) {
      throw new Error(
        `Error: no quantity received for form ${f.id}, cannot process groups.`
      );
    }

    const quantity = grouping.find(
      formFraction => formFraction.form.id === f.id
    )?.quantity;

    const quantityGroupedInOtherForms = f.groupedIn.reduce(
      (counter, formGroupement) => {
        if (formGroupement.nextFormId !== form.id) {
          return counter.plus(formGroupement.quantity);
        }
        return counter;
      },
      new Decimal(0)
    );

    return {
      form: f,
      quantity:
        quantity ??
        new Decimal(f.quantityReceived)
          .minus(quantityGroupedInOtherForms)
          .toNumber(),
      quantityGroupedInOtherForms
    };
  });

  const errors = formFractions.reduce<string[]>(
    (acc, { form: initialForm, quantity, quantityGroupedInOtherForms }) => {
      const destinationSiret = initialForm.forwardedIn
        ? initialForm.forwardedIn.recipientCompanySiret
        : initialForm.recipientCompanySiret;

      if (destinationSiret !== form.emitterCompanySiret) {
        return [
          ...acc,
          `Le bordereau ${initialForm.id} n'est pas en possession du nouvel émetteur`
        ];
      }

      const quantityLeftToGroup = new Decimal(
        initialForm.forwardedIn
          ? initialForm.forwardedIn.quantityReceived!
          : initialForm.quantityReceived!
      )
        .minus(quantityGroupedInOtherForms)
        .toDecimalPlaces(6); // set precision to gramme

      if (quantityLeftToGroup.equals(0)) {
        return [
          ...acc,
          `Le bordereau ${initialForm.readableId} a déjà été regroupé en totalité`
        ];
      }

      if (quantity <= 0) {
        return [
          ...acc,
          `La quantité regroupée sur le BSDD ${initialForm.readableId} doit être supérieure à 0`
        ];
      }

      if (new Decimal(quantity).greaterThan(quantityLeftToGroup)) {
        return [
          ...acc,
          `La quantité restante à regrouper sur le BSDD ${
            initialForm.readableId
          } est de ${Number.parseFloat(
            quantityLeftToGroup.toFixed(4)
          )} T. Vous tentez de regrouper ${quantity} T.`
        ];
      }

      return acc;
    },
    []
  );

  if (errors.length > 0) {
    throw new UserInputError(errors.join("\n"));
  }

  return formFractions;
}

export async function validateAppendix1Groupement(
  form: Partial<Form | Prisma.FormCreateInput>,
  grouping: InitialFormFractionInput[]
) {
  if (!form.emitterCompanySiret) {
    throw new UserInputError(
      "Vous devez renseigner le numéro SIRET de l'établissement de collecte du BSDD de tournée dédiée"
    );
  }

  const formIds = grouping.map(({ form }) => form.id);
  const duplicates = formIds.filter(
    (id, index) => formIds.indexOf(id) !== index
  );
  if (duplicates.length > 0) {
    throw new UserInputError(
      `Un même bordereau d'annexe 1 ne peut pas être rattaché plusieurs fois à un bordereau de tournée. Bordereaux concernés: ${duplicates.join(
        ", "
      )}`
    );
  }

  const initialForms = await prisma.form.findMany({
    where: {
      id: { in: grouping.map(({ form }) => form.id) },
      emitterType: EmitterType.APPENDIX1_PRODUCER,
      status: {
        in: [
          Status.DRAFT,
          Status.SEALED,
          Status.SIGNED_BY_PRODUCER,
          Status.SENT
        ]
      },
      isDeleted: false
    },
    include: {
      groupedIn: true
    }
  });

  if (grouping.length > 0 && initialForms.length < grouping.length) {
    const notFoundIds = grouping
      .map(({ form }) => form.id)
      .filter(id => !initialForms.map(p => p.id).includes(id));
    throw new UserInputError(
      `Les BSDD d'annexe 1 ${notFoundIds.join(
        ", "
      )} n'existent pas ou ne sont pas des bordereaux d'annexe 1`
    );
  }

  const formFractions = initialForms.map(initialForm => {
    if (
      initialForm.groupedIn?.length === 1 &&
      initialForm.groupedIn[0].nextFormId !== form.id
    ) {
      throw new UserInputError(
        `Une annexe 1 ne peut pas être rattachée à plusieurs bordereaux de tournée. Le bordereau ${initialForm.id} est déjà rattaché au bordereau de tournée ${initialForm.groupedIn[0].id}`
      );
    }

    return {
      form: initialForm,
      quantity: initialForm.quantityReceived ?? 0
    };
  });

  // Once one of the appendix has been signed by the transporter,
  // you have 3 days maximum to add new appendix
  const currentDate = new Date();
  const firstTransporterSignatureDate = initialForms.reduce((date, form) => {
    const { takenOverAt } = form;
    return takenOverAt && takenOverAt < date ? takenOverAt : date;
  }, currentDate);
  const limitDate = sub(currentDate, {
    days: 2,
    hours: currentDate.getHours(),
    minutes: currentDate.getMinutes()
  });
  if (firstTransporterSignatureDate < limitDate) {
    throw new UserInputError(
      `Impossible d'ajouter une annexe 1. Un bordereau de tournée ne peut être utilisé que durant 3 jours consécutifs à partir du moment où la première collecte (transporteur) est signée. La première collecte a été réalisée le ${format(
        firstTransporterSignatureDate,
        "dd/MM/yyyy"
      )}`
    );
  }

  return formFractions;
}
