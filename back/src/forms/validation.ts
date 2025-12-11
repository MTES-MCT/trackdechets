import {
  Consistence,
  EmitterType,
  Form as PrismaForm,
  Prisma,
  QuantityType,
  Status,
  TransportMode,
  WasteAcceptationStatus,
  OperationMode,
  EmptyReturnADR
} from "@td/prisma";
import { Decimal } from "decimal.js";
import { checkVAT } from "jsvat";
import countries from "world-countries";
import * as yup from "yup";
import {
  BAD_CHARACTERS_REGEXP,
  countries as vatCountries,
  isForeignVat,
  isOmi,
  isSiret,
  isVat,
  BSDD_APPENDIX1_WASTE_CODES,
  BSDD_WASTE_CODES,
  isDangerous,
  PROCESSING_AND_REUSE_OPERATIONS_CODES,
  PROCESSING_OPERATIONS_CODES,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES,
  getOperationModes
} from "@td/constants";
import {
  foreignVatNumber,
  intermediarySchema,
  REQUIRED_RECEIPT_DEPARTMENT,
  REQUIRED_RECEIPT_NUMBER,
  REQUIRED_RECEIPT_VALIDITYLIMIT,
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
import type {
  CiterneNotWashedOutReason,
  CompanyInput,
  InitialFormFractionInput,
  PackagingInfo,
  Packagings
} from "@td/codegen-back";
import { prisma } from "@td/prisma";
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
  MISSING_PROCESSING_OPERATION
} from "./errors";
import { format, sub } from "date-fns";
import { UserInputError } from "../common/errors";
import { ConditionConfig } from "yup/lib/Condition";
import { isFinalOperationCode } from "../common/operationCodes";
import { flattenFormInput } from "./converter";
import { bsddWasteQuantities } from "./helpers/bsddWasteQuantities";
import { isDefined, isDefinedStrict } from "../common/helpers";
import { onlyWhiteSpace } from "../common/validation/zod/refinement";
import {
  ERROR_TRANSPORTER_PLATES_TOO_MANY,
  ERROR_TRANSPORTER_PLATES_INCORRECT_LENGTH,
  ERROR_TRANSPORTER_PLATES_INCORRECT_FORMAT
} from "../common/validation/messages";
import { getBsddSubType } from "../common/subTypes";

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

export type Transporter = Pick<
  Prisma.BsddTransporterCreateInput,
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
  | "transporterTransportMode"
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
  | "nextDestinationCompanyExtraEuropeanId"
  | "nextDestinationNotificationNumber"
>;

export const MEP_2025_05_2 = new Date("2025-06-04");

export type Form = Emitter &
  Recipient &
  WasteDetails &
  Trader &
  Broker &
  ReceivedInfo &
  AcceptedInfo &
  SigningInfo &
  ProcessedInfo & {
    transporters: Transporter[];
  };

// Context used to determine if some fields are required or not
type FormValidationContext = {
  isDraft: boolean;
  // orgId of the transporter signing the Form
  signingTransporterOrgId?: string | null;
};

export const hasPipelinePackaging = (
  value: Pick<Form, "wasteDetailsPackagingInfos">
): boolean =>
  ((value.wasteDetailsPackagingInfos ?? []) as PackagingInfo[]).some(
    i => i.type === "PIPELINE"
  );

const getReceptionData = (context: any, isTempStorage = false) => {
  if (isTempStorage) {
    return {
      wasteAcceptationStatus: context.wasteAcceptationStatus,
      quantityReceived: context.temporaryStorageTemporaryStorerQuantityReceived,
      quantityRefused: context.temporaryStorageTemporaryStorerQuantityRefused
    };
  }

  return {
    wasteAcceptationStatus:
      context?.forwardedIn?.wasteAcceptationStatus ??
      context?.wasteAcceptationStatus,
    quantityReceived: isDefined(context?.quantityReceived)
      ? context?.quantityReceived
      : context?.forwardedIn?.quantityReceived,
    quantityRefused: isDefined(context?.quantityReceived)
      ? context?.quantityRefused
      : context?.forwardedIn?.quantityRefused
  };
};

export const quantityRefusedSchemaBuilder = (isTempStorage = false) =>
  weight(WeightUnits.Tonne)
    .min(0)
    .test(
      "not-defined-if-no-quantity-received",
      "La quantité refusée (quantityRefused) ne peut être définie si la quantité reçue (quantityReceived) ne l'est pas",
      (value, context) => {
        const { quantityReceived } = getReceptionData(
          context.parent,
          isTempStorage
        );

        const quantityReceivedIsDefined = isDefined(quantityReceived);
        const quantityRefusedIsDefined = isDefined(value);

        if (!quantityReceivedIsDefined && quantityRefusedIsDefined)
          return false;
        return true;
      }
    )
    .test(
      "waste-is-accepted",
      "La quantité refusée (quantityRefused) ne peut être supérieure à zéro si le déchet est accepté (ACCEPTED)",
      (value, context) => {
        const { wasteAcceptationStatus } = getReceptionData(
          context.parent,
          isTempStorage
        );

        if (wasteAcceptationStatus !== WasteAcceptationStatus.ACCEPTED)
          return true;

        // Legacy
        if (value === null || value === undefined) return true;

        return value === 0;
      }
    )
    .test(
      "waste-is-refused",
      "La quantité refusée (quantityRefused) doit être égale à la quantité reçue (quantityReceived) si le déchet est refusé (REFUSED)",
      (value, context) => {
        const { wasteAcceptationStatus, quantityReceived } = getReceptionData(
          context.parent,
          isTempStorage
        );

        if (wasteAcceptationStatus !== WasteAcceptationStatus.REFUSED)
          return true;

        // Legacy
        if (value === null || value === undefined) return true;

        return value === quantityReceived;
      }
    )
    .test(
      "waste-is-partially-refused",
      "La quantité refusée (quantityRefused) doit être inférieure à la quantité reçue (quantityReceived) et supérieure à zéro si le déchet est partiellement refusé (PARTIALLY_REFUSED)",
      (value, context) => {
        const { wasteAcceptationStatus, quantityReceived } = getReceptionData(
          context.parent,
          isTempStorage
        );

        if (wasteAcceptationStatus !== WasteAcceptationStatus.PARTIALLY_REFUSED)
          return true;

        // Legacy
        if (value === null || value === undefined) return true;

        return value > 0 && value < quantityReceived;
      }
    )
    .test(
      "lower-than-quantity-received",
      "La quantité refusée (quantityRefused) doit être inférieure ou égale à la quantité réceptionnée (quantityReceived)",
      (value, context) => {
        const { quantityReceived } = getReceptionData(
          context.parent,
          isTempStorage
        );

        if (!isDefined(quantityReceived)) return true;

        // Legacy
        if (value === null || value === undefined) return true;

        return value <= quantityReceived;
      }
    );

export const quantityRefusedRequired = quantityRefusedSchemaBuilder().test(
  "quantity-is-required",
  "La quantité refusée (quantityRefused) est requise",
  (value, context) => {
    const { wasteAcceptationStatus } = getReceptionData(context.parent);

    // La quantity refusée est obligatoire à l'étape d'acceptation,
    // donc si wasteAcceptationStatus est renseigné
    if (isDefined(wasteAcceptationStatus) && !isDefined(value)) {
      return false;
    }

    return true;
  }
);

export const revisionRequestQuantityRefused =
  quantityRefusedSchemaBuilder(false);
export const revisionRequestTempStorageQuantityRefused =
  quantityRefusedSchemaBuilder(true);

// *************************************************************
// DEFINES VALIDATION SCHEMA FOR INDIVIDUAL FRAMES IN BSD PAGE 1
// *************************************************************

// 1 - Émetteur du bordereau
const emitterSchemaFn: FactorySchemaOf<FormValidationContext, Emitter> = ({
  isDraft
}) =>
  yup.object({
    emitterPickupSite: yup.string().max(250).nullable(),
    emitterWorkSiteAddress: yup.string().max(250).nullable(),
    emitterWorkSiteCity: yup.string().max(100).nullable(),
    emitterWorkSiteInfos: yup.string().max(500).nullable(),
    emitterWorkSiteName: yup.string().max(250).nullable(),
    emitterWorkSitePostalCode: yup.string().max(20).nullable(),
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
      .max(250)
      .ensure()
      .when("emitterIsForeignShip", (emitterIsForeignShip, schema) =>
        emitterIsForeignShip === true ? schema.notRequired() : schema
      )
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_NAME}`),
    emitterCompanySiret: siret
      .label("Émetteur")
      .when("emitterIsForeignShip", siretConditions.isForeignShip)
      .when("emitterIsPrivateIndividual", siretConditions.isPrivateIndividual)
      .test(
        "is-not-eco-organisme",
        "L'émetteur ne peut pas être un éco-organisme. Merci de bien vouloir renseigner l'émetteur effectif de ce déchet (ex: déchetterie, producteur, TTR...). Un autre champ dédié existe et doit être utilisé pour viser l'éco-organisme concerné : https://faq.trackdechets.fr/dechets-dangereux-classiques/les-eco-organismes-sur-trackdechets#ou-etre-vise-en-tant-queco-organisme",
        async value => {
          if (!value) return true;

          const ecoOrganisme = await prisma.ecoOrganisme.findFirst({
            where: { siret: value, handleBsdd: true },
            select: { id: true }
          });

          return !ecoOrganisme;
        }
      )
      .test(siretTests.isNotDormant)
      .when(["emitterIsForeignShip", "emitterIsPrivateIndividual"], {
        is: (isForeignShip: boolean, isPrivateIndividual: boolean) =>
          !isForeignShip && !isPrivateIndividual,
        then: schema =>
          schema.requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_SIRET}`)
      }),
    emitterCompanyAddress: yup
      .string()
      .max(250)
      .ensure()
      .when("emitterIsForeignShip", (emitterIsForeignShip, schema) =>
        emitterIsForeignShip === true ? schema.notRequired() : schema
      )
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_ADDRESS}`),
    emitterCompanyContact: yup
      .string()
      .max(250)
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
      .max(20)
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
      .max(250)
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
      .max(250)
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
      "corepile-deprecated",
      "COREPILE a fusionné avec ECOSYTEM. Il n'est plus possible de viser COREPILE comme éco-organisme sur un bordereau, vous devez désormais viser le SIRET d'ECOSYSTEM (83033936200022)",
      async value => {
        return value !== "42248908800068";
      }
    )
    .test(
      "is-known-eco-organisme",
      "L'éco-organisme avec le siret \"${value}\" n'est pas reconnu.",
      ecoOrganismeSiret =>
        ecoOrganismeSiret
          ? prisma.ecoOrganisme
              .findFirst({
                where: { siret: ecoOrganismeSiret, handleBsdd: true }
              })
              .then(el => el != null)
          : true
    ),
  ecoOrganismeName: yup.string().max(250).notRequired().nullable()
});

// 2 - Installation de destination ou d’entreposage ou de reconditionnement prévue
export const recipientSchemaFn: FactorySchemaOf<
  FormValidationContext,
  Recipient
> = ({ isDraft }) =>
  yup.object({
    recipientCap: yup
      .string()
      .max(250)
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
      .max(250)
      .label("Opération d’élimination / valorisation")
      .ensure()
      .when("recipientIsTempStorage", {
        is: recipientIsTempStorage => !recipientIsTempStorage,
        then: s => s.requiredIf(!isDraft)
      })
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
      .max(250)
      .ensure()
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_NAME}`),
    recipientCompanySiret: siret
      .label("Destinataire")
      .test(siretTests.isRegistered("DESTINATION"))
      .test(siretTests.isNotDormant)
      .test(siretTests.destinationHasAppropriateSubProfiles)
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_SIRET}`),
    recipientCompanyAddress: yup
      .string()
      .max(250)
      .ensure()
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_ADDRESS}`),
    recipientCompanyContact: yup
      .string()
      .max(250)
      .ensure()
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_CONTACT}`),
    recipientCompanyPhone: yup
      .string()
      .max(20)
      .ensure()
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_PHONE}`),
    recipientCompanyMail: yup
      .string()
      .max(250)
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
      .test({
        name: "is-not-pipeline",
        test: value => value !== "PIPELINE",
        message: "Le type de conditionnement PIPELINE n'est pas valide"
      })
      .required("Le type de conditionnement doit être précisé."),
    other: yup
      .string()
      .max(250)
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
      ),
    volume: yup
      .number()
      .optional()
      .nullable()
      .moreThan(0, "Le volume doit être un nombre positif"),
    identificationNumbers: yup.array(yup.string()).optional().notRequired()
  });

const parcelCommonInfos = yup
  .object({
    city: yup.string().max(250).required("Parcelle: la ville est obligatoire"),
    inseeCode: yup
      .string()
      .max(250)
      .required("Parcelle: le code INSEE de la commune est obligatoire")
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
const patternSixDigitsAfterComma = /^[-+]?\d+(\.\d{0,6})?$/;
const parcelCoordinates = yup.object({
  x: yup
    .number()
    .test(
      "is-decimal",
      "La coordonnée ne peut pas avoir plus de 6 décimales",
      (val: any) => {
        if (val != undefined) {
          return patternSixDigitsAfterComma.test(val);
        }
        return true;
      }
    )
    .min(-90, "Parcelle: la coordonnée X doit être supérieure ou égale à -90")
    .max(90, "Parcelle: la coordonnée X doit être inférieure ou égale à 90")
    .required("Parcelle: la coordonnée X est obligatoire"),
  y: yup
    .number()
    .test(
      "is-decimal",
      "La coordonnée ne peut pas avoir plus de 6 décimales",
      (val: any) => {
        if (val != undefined) {
          return patternSixDigitsAfterComma.test(val);
        }
        return true;
      }
    )
    .min(-180, "Parcelle: la coordonnée Y doit être supérieure ou égale à -180")
    .max(180, "Parcelle: la coordonnée Y doit être inférieure ou égale à 180")
    .required("Parcelle: la coordonnée Y est obligatoire")
});
const parcelInfos = yup.lazy(value => {
  if (value.prefix || value.section || value.number) {
    return parcelCommonInfos.concat(parcelNumber);
  }
  return parcelCommonInfos.concat(parcelCoordinates);
});

const isValidPackagingInfos: yup.TestFunction<
  PackagingInfo[] | undefined
> = value => {
  const hasCiterne = value?.some(i => i.type === "CITERNE");
  const hasBenne = value?.some(i => i.type === "BENNE");

  if (
    // citerne and benne together are not allowed
    hasCiterne &&
    hasBenne
  ) {
    return false;
  }

  const hasOtherPackaging = value?.find(
    i => !["CITERNE", "BENNE"].includes(i.type)
  );
  if ((hasCiterne || hasBenne) && hasOtherPackaging) {
    return false;
  }

  return true;
};

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
      .max(250)
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
    wasteDetailsIsSubjectToADR: yup.boolean().nullable(),
    wasteDetailsOnuCode: yup
      .string()
      .max(750)
      .nullable()
      // Empty values (or spaces) to null
      .transform(value =>
        isDefinedStrict(value?.replace(/\s/g, "")) ? value : null
      )
      .test((_, ctx) => {
        if (isDraft) return true;

        const {
          wasteDetailsIsDangerous,
          wasteDetailsIsSubjectToADR,
          wasteDetailsOnuCode,
          createdAt
        } = ctx.parent;

        // User must be able to forward a legacy BSD without wasteDetailsIsSubjectToADR
        const bsdSubType = getBsddSubType(ctx.parent);
        if (bsdSubType === "TEMP_STORED") {
          return true;
        }

        // Field becomes required after MEP_2025_05_2. Be careful and don't break BSDs created before
        if (
          !isDefined(createdAt) ||
          new Date(createdAt).getTime() >= MEP_2025_05_2.getTime()
        ) {
          if (!isDefined(wasteDetailsIsSubjectToADR)) {
            return new yup.ValidationError(
              `Vous devez préciser si le bordereau est soumis à l'ADR ou non (champ wasteDetailsIsSubjectToADR).`
            );
          }
        }

        // New method: using the switch wasteDetailsIsSubjectToADR
        if (isDefined(wasteDetailsIsSubjectToADR)) {
          if (
            wasteDetailsIsSubjectToADR === true &&
            !isDefined(wasteDetailsOnuCode)
          ) {
            return new yup.ValidationError(
              `Le déchet est soumis à l'ADR. Vous devez préciser la mention correspondante.`
            );
          } else if (
            wasteDetailsIsSubjectToADR === false &&
            isDefined(wasteDetailsOnuCode)
          ) {
            return new yup.ValidationError(
              `Le déchet n'est pas soumis à l'ADR. Vous ne pouvez pas préciser de mention ADR.`
            );
          }
        }
        // Legacy
        else {
          if (
            wasteDetailsIsDangerous === true &&
            !isDefined(wasteDetailsOnuCode)
          ) {
            return new yup.ValidationError(
              `La mention ADR est obligatoire pour les déchets dangereux. Merci d'indiquer "non soumis" si nécessaire.`
            );
          }
        }

        return true;
      }),
    wasteDetailsNonRoadRegulationMention: yup.string().max(250).nullable(),
    wasteDetailsParcelNumbers: yup.array().of(parcelInfos as any),
    wasteDetailsAnalysisReferences: yup
      .array()
      .of(yup.string().max(250)) as any,
    wasteDetailsLandIdentifiers: yup.array().of(yup.string().max(250)) as any,
    wasteDetailsConsistence: (isDraft
      ? yup
          .array()
          .of(yup.mixed<Consistence>().oneOf(Object.values(Consistence)))
          .nullable()
      : yup
          .array()
          .of(yup.mixed<Consistence>().oneOf(Object.values(Consistence)))
          .min(1, "Au moins une consistance doit être sélectionnée")) as any,
    wasteDetailsPackagingInfos: yup
      .array()
      .of(packagingInfoFn({ isDraft }) as any)
      .test(
        "is-valid-packaging-infos",
        "${path} ne peut pas à la fois contenir 1 citerne, 1 benne et un autre conditionnement.",
        isValidPackagingInfos
      )
  });

// Schéma lorsque emitterType = APPENDIX1
const wasteDetailsAppendix1SchemaFn: FactorySchemaOf<
  Pick<FormValidationContext, "isDraft">,
  WasteDetailsAppendix1
> = ({ isDraft }) =>
  baseWasteDetailsSchemaFn({ isDraft }).concat(
    yup.object({
      wasteDetailsName: yup.string().max(250).nullable(),
      wasteDetailsCode: yup
        .string()
        .requiredIf(!isDraft, "Le code déchet est obligatoire")
        .oneOf(
          [...BSDD_APPENDIX1_WASTE_CODES, "", null],
          "Le code déchet n'est pas utilisable sur une annexe 1."
        )
    })
  );

// Schéma lorsque emitterType = APPENDIX1_PRODUCER
// TODO: Typing as any because in schemaOf<> Yup always wraps arrays as Maybe<>.
// and it breaks typings
const wasteDetailsAppendix1ProducerSchemaFn: (
  context: Pick<FormValidationContext, "isDraft">
) => any = ({ isDraft }) =>
  yup.object({
    wasteDetailsQuantity: weight(WeightUnits.Tonne)
      .label("Déchet")
      .when(
        ["transporters", "createdAt"],
        weightConditions.transporters(WeightUnits.Tonne)
      ),
    wasteDetailsPackagingInfos: yup
      .array()
      .of(packagingInfoFn({ isDraft }) as any)
      .transform(value => (!value ? [] : value))
      .test(
        "is-valid-packaging-infos",
        "${path} ne peut pas à la fois contenir 1 citerne, 1 benne et un autre conditionnement.",
        isValidPackagingInfos
      ) as any
  });

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
          "${path} ne peut pas à la fois contenir 1 citerne, 1 benne et un autre conditionnement.",
          isValidPackagingInfos
        )
        .when("isDirectSupply", {
          is: true,
          then: schema =>
            schema.max(
              0,
              "Aucun conditionnement ne doit être renseigné dans le cadre d'un acheminement direct " +
                "par pipeline ou convoyeur"
            )
        }),
      wasteDetailsQuantity: weight(WeightUnits.Tonne)
        .test(
          "is-not-zero",
          "${path} : le poids doit être supérieur à 0",
          value => isDraft || (value != null && value > 0)
        )
        .label("Déchet")
        .when(
          ["transporters", "createdAt"],
          weightConditions.transporters(WeightUnits.Tonne)
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
      return wasteDetailsAppendix1ProducerSchemaFn(context);
    }

    if (value.emitterType === EmitterType.APPENDIX1) {
      return wasteDetailsAppendix1SchemaFn(context);
    }
    return wasteDetailsNormalSchemaFn(context);
  });

/**
 * Condition that can be enforced on specific transporter fields to ensure the field is
 * present before the transporter sign the Form.
 * The orgId of the transporter signing the form is passed down to the validation context
 * during the signature validation process and is compared to the SIRET or vat number
 * of the transporter under validation.
 */
const requiredWhenTransporterSign: (
  context: Pick<FormValidationContext, "signingTransporterOrgId">,
  errorMsg: string
) => ConditionConfig<yup.StringSchema> = (
  { signingTransporterOrgId },
  errorMsg
) => ({
  is: (siret: string, vatNumber: string) => {
    return (
      signingTransporterOrgId &&
      [siret, vatNumber].includes(signingTransporterOrgId)
    );
  },
  then: schema => {
    return schema.nullable().required(errorMsg);
  },
  otherwise: schema => {
    return schema.nullable().notRequired();
  }
});

//
// 8 - Collecteur-transporteur

// utility fn
export const validatePlates = (transporterNumberPlate: string) => {
  // convert plate  string to an array
  const plates = formatInitialPlates(transporterNumberPlate);

  if (plates.length > 2) {
    return new yup.ValidationError(ERROR_TRANSPORTER_PLATES_TOO_MANY);
  }

  if (
    plates.some(plate => (plate ?? "").length > 12 || (plate ?? "").length < 4)
  ) {
    return new yup.ValidationError(ERROR_TRANSPORTER_PLATES_INCORRECT_LENGTH);
  }

  if (plates.some(plate => onlyWhiteSpace(plate ?? ""))) {
    return new yup.ValidationError(ERROR_TRANSPORTER_PLATES_INCORRECT_FORMAT);
  }
  return true;
};

export const transporterSchemaFn: FactorySchemaOf<
  Pick<FormValidationContext, "signingTransporterOrgId">,
  Transporter
> = context =>
  yup.object({
    transporterCustomInfo: yup.string().max(250).nullable(),
    transporterNumberPlate: yup
      .string()
      .max(250)
      .nullable()
      .test((transporterNumberPlate, ctx) => {
        const {
          transporterTransportMode,
          transporterCompanySiret,
          transporterCompanyVatNumber,
          takenOverAt
        } = ctx.parent;

        if (
          context.signingTransporterOrgId &&
          [transporterCompanySiret, transporterCompanyVatNumber].includes(
            context.signingTransporterOrgId
          ) &&
          transporterTransportMode === "ROAD" &&
          !transporterNumberPlate
        ) {
          return new yup.ValidationError(
            "La plaque d'immatriculation est requise"
          );
        }

        if (!transporterNumberPlate) {
          return true;
        }

        // Skip if already takenOver, useful for the multimodal because validation may be re-applied on already taken over transporters
        if (takenOverAt) {
          return true;
        }
        return validatePlates(transporterNumberPlate);
      }),
    transporterCompanyName: yup
      .string()
      .max(250)
      .ensure()
      .when(
        ["transporterCompanySiret", "transporterCompanyVatNumber"],
        requiredWhenTransporterSign(
          context,
          `Transporteur: ${MISSING_COMPANY_NAME}`
        )
      ),
    // We do not need to check for the presence of either a SIRET or VAT number
    // because bsdd transporter data is only validated before a specific transporter sign.
    // It guarantees that the BSDD transporter data has matched against either the SIRET
    // or VAT number.
    transporterCompanySiret: siret
      .label("Transporteur")
      .test(siretTests.isRegistered("TRANSPORTER"))
      .test(siretTests.isNotDormant),
    transporterCompanyVatNumber: foreignVatNumber
      .label("Transporteur")
      .test(vatNumberTests.isRegisteredTransporter),
    transporterCompanyAddress: yup
      .string()
      .max(250)
      .ensure()
      .when(
        ["transporterCompanySiret", "transporterCompanyVatNumber"],
        requiredWhenTransporterSign(
          context,
          `Transporteur: ${MISSING_COMPANY_ADDRESS}`
        )
      ),
    transporterCompanyContact: yup
      .string()
      .max(250)
      .ensure()
      .when(
        ["transporterCompanySiret", "transporterCompanyVatNumber"],
        requiredWhenTransporterSign(
          context,
          `Transporteur: ${MISSING_COMPANY_CONTACT}`
        )
      ),
    transporterCompanyPhone: yup
      .string()
      .max(20)
      .ensure()
      .when(
        ["transporterCompanySiret", "transporterCompanyVatNumber"],
        requiredWhenTransporterSign(
          context,
          `Transporteur: ${MISSING_COMPANY_PHONE}`
        )
      ),
    transporterCompanyMail: yup
      .string()
      .max(250)
      .email()
      .ensure()
      .when(
        ["transporterCompanySiret", "transporterCompanyVatNumber"],
        requiredWhenTransporterSign(
          context,
          `Transporteur: ${MISSING_COMPANY_EMAIL}`
        )
      ),
    transporterIsExemptedOfReceipt: yup.boolean().notRequired().nullable(),
    transporterReceipt: yup
      .string()
      .max(250)
      .when(
        [
          "transporterIsExemptedOfReceipt",
          "transporterCompanyVatNumber",
          "transporterTransportMode"
        ],
        {
          is: (isExempted, vat, transportMode) =>
            isForeignVat(vat) ||
            isExempted ||
            (transportMode && transportMode !== TransportMode.ROAD),
          then: schema => schema.notRequired().nullable(),
          otherwise: schema =>
            schema.when(
              ["transporterCompanySiret", "transporterCompanyVatNumber"],
              requiredWhenTransporterSign(context, REQUIRED_RECEIPT_NUMBER)
            )
        }
      ),
    transporterDepartment: yup
      .string()
      .max(250)
      .when(
        [
          "transporterIsExemptedOfReceipt",
          "transporterCompanyVatNumber",
          "transporterTransportMode"
        ],
        {
          is: (isExempted, vat, transportMode) =>
            isForeignVat(vat) ||
            isExempted ||
            (transportMode && transportMode !== TransportMode.ROAD),
          then: schema => schema.notRequired().nullable(),
          otherwise: schema =>
            schema.when(
              ["transporterCompanySiret", "transporterCompanyVatNumber"],
              requiredWhenTransporterSign(context, REQUIRED_RECEIPT_DEPARTMENT)
            )
        }
      ),
    transporterValidityLimit: yup
      .string()
      .max(250)
      .when(
        [
          "transporterIsExemptedOfReceipt",
          "transporterCompanyVatNumber",
          "transporterTransportMode"
        ],
        {
          is: (isExempted, vat, transportMode) =>
            isForeignVat(vat) ||
            isExempted ||
            (transportMode && transportMode !== TransportMode.ROAD),
          then: schema => schema.notRequired().nullable(),
          otherwise: schema =>
            schema.when(
              ["transporterCompanySiret", "transporterCompanyVatNumber"],
              requiredWhenTransporterSign(
                context,
                REQUIRED_RECEIPT_VALIDITYLIMIT
              )
            )
        }
      ),
    transporterTransportMode: yup
      .mixed<TransportMode>()
      .nullable()
      .test((transporterTransportMode, ctx) => {
        const { transporterCompanySiret, transporterCompanyVatNumber } =
          ctx.parent;

        if (
          context.signingTransporterOrgId &&
          [transporterCompanySiret, transporterCompanyVatNumber].includes(
            context.signingTransporterOrgId
          ) &&
          !transporterTransportMode
        ) {
          return new yup.ValidationError(
            "Le mode de transport est obligatoire"
          );
        }

        return true;
      })
  });

export const traderSchemaFn: FactorySchemaOf<FormValidationContext, Trader> = ({
  isDraft
}) =>
  yup.object({
    traderCompanySiret: siret
      .label("Négociant")
      .test(siretTests.isRegistered("TRADER")),
    traderCompanyName: yup
      .string()
      .max(250)
      .when("traderCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_NAME}`),
        otherwise: schema => schema.notRequired().nullable()
      }),
    traderCompanyAddress: yup
      .string()
      .max(250)
      .when("traderCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_ADDRESS}`),
        otherwise: schema => schema.notRequired().nullable()
      }),
    traderCompanyContact: yup
      .string()
      .max(250)
      .when("traderCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_CONTACT}`),
        otherwise: schema => schema.notRequired().nullable()
      }),
    traderCompanyPhone: yup
      .string()
      .max(20)
      .when("traderCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_PHONE}`),
        otherwise: schema => schema.notRequired().nullable()
      }),
    traderCompanyMail: yup
      .string()
      .max(250)
      .email()
      .when("traderCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_EMAIL}`),
        otherwise: schema => schema.notRequired().nullable()
      }),
    traderReceipt: yup
      .string()
      .max(250)
      .when("traderCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, "Négociant: Numéro de récepissé obligatoire"),
        otherwise: schema => schema.notRequired().nullable()
      }),
    traderDepartment: yup
      .string()
      .max(250)
      .when("traderCompanySiret", {
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
    brokerCompanySiret: siret
      .label("Courtier")
      .test(siretTests.isRegistered("BROKER")),
    brokerCompanyName: yup
      .string()
      .max(250)
      .when("brokerCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_NAME}`),
        otherwise: schema => schema.notRequired().nullable()
      }),
    brokerCompanyAddress: yup
      .string()
      .max(250)
      .when("brokerCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_ADDRESS}`),
        otherwise: schema => schema.notRequired().nullable()
      }),
    brokerCompanyContact: yup
      .string()
      .max(250)
      .when("brokerCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_CONTACT}`),
        otherwise: schema => schema.notRequired().nullable()
      }),
    brokerCompanyPhone: yup
      .string()
      .max(20)
      .when("brokerCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_PHONE}`),
        otherwise: schema => schema.notRequired().nullable()
      }),
    brokerCompanyMail: yup
      .string()
      .max(250)
      .when("brokerCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_EMAIL}`),
        otherwise: schema => schema.notRequired().nullable()
      }),
    brokerReceipt: yup
      .string()
      .max(250)
      .when("brokerCompanySiret", {
        is: siret => !!siret,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, "Courtier : Numéro de récepissé obligatoire"),
        otherwise: schema => schema.notRequired().nullable()
      }),
    brokerDepartment: yup
      .string()
      .max(250)
      .when("brokerCompanySiret", {
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
    .max(250)
    .ensure()
    .required("Le nom de l'émetteur du bordereau est obligatoire")
});

// 10 - Expédition reçue à l’installation de destination
export const receivedInfoSchema: yup.SchemaOf<ReceivedInfo> = yup.object({
  isAccepted: yup.boolean(),
  receivedBy: yup
    .string()
    .max(250)
    .ensure()
    .required("Vous devez saisir un responsable de la réception."),
  receivedAt: yup.date().required(),
  signedAt: yup.date().nullable(),
  quantityReceived: weight(WeightUnits.Tonne)
    .label("Réception")
    .when("wasteAcceptationStatus", weightConditions.bsddWasteAcceptationStatus)
    .when("transporters", weightConditions.transporters(WeightUnits.Tonne)),
  quantityRefused: quantityRefusedRequired,
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
    .max(250)
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
    .max(250)
    .ensure()
    .required("Vous devez saisir un responsable de la réception."),
  quantityReceived: weight(WeightUnits.Tonne)
    .label("Réception")
    .required("${path} : Le poids reçu en tonnes est obligatoire")
    .when(
      "wasteAcceptationStatus",
      weightConditions.bsddWasteAcceptationStatus as any
    )
    .test(
      "not-defined-if-no-quantity-received",
      "La quantité reçue ne peut être égale à zéro si le déchet a été totalement refusé (REFUSED)",
      (quantityReceived, context) => {
        const { wasteAcceptationStatus } = context.parent;
        if (
          quantityReceived === 0 &&
          wasteAcceptationStatus === WasteAcceptationStatus.REFUSED
        ) {
          return false;
        }

        return true;
      }
    ),
  quantityRefused: quantityRefusedRequired,
  wasteAcceptationStatus: yup.mixed<WasteAcceptationStatus>().required(),
  wasteRefusalReason: yup
    .string()
    .max(250)
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
    ),
  hasCiterneBeenWashedOut: yup
    .boolean()
    .notRequired()
    .nullable()
    .test(
      "not-defined-if-not-citerne",
      "Vous ne pouvez préciser si la citerne a été rincée si le conditionnement du déchet n'est pas une citerne",
      (value, context) => {
        const { wasteDetailsPackagingInfos } = context.parent;

        if (!isDefined(value)) return true;

        const hasCiterne = wasteDetailsPackagingInfos.some(
          info => info.type === "CITERNE"
        );

        return hasCiterne;
      }
    )
    .test(
      "not-defined-if-waste-not-accepted",
      "Vous ne pouvez préciser si la citerne a été rincée que si le déchet a été totalement accepté",
      (value, context) => {
        const { wasteAcceptationStatus } = context.parent;

        if (!isDefined(value)) return true;

        return Boolean(wasteAcceptationStatus === "ACCEPTED");
      }
    ),
  citerneNotWashedOutReason: yup
    .mixed<CiterneNotWashedOutReason>()
    .notRequired()
    .nullable()
    .test(
      "reason-if-not-washed",
      "Vous devez préciser la raison pour laquelle la citerne n'a pas été rincée",
      (value, context) => {
        const { hasCiterneBeenWashedOut } = context.parent;

        if (hasCiterneBeenWashedOut === false) {
          return isDefined(value);
        }

        return true;
      }
    )
    .test(
      "no-reason-if-washed-or-undefined",
      "Vous ne pouvez préciser de raison pour l'absence de rinçage que si la citerne n'a pas été rincée",
      (value, context) => {
        const { hasCiterneBeenWashedOut } = context.parent;

        if (hasCiterneBeenWashedOut !== false) {
          return !isDefined(value);
        }

        return true;
      }
    ),
  emptyReturnADR: yup
    .mixed<EmptyReturnADR>()
    .notRequired()
    .nullable()
    .test(
      "not-defined-if-not-citerne-or-benne",
      "Vous ne pouvez pas préciser de retour à vide ADR si le conditionnement du déchet n'est pas une citerne ou une benne",
      (value, context) => {
        const { wasteDetailsPackagingInfos } = context.parent;

        if (!isDefined(value)) return true;

        const hasCiterneOrBenne = wasteDetailsPackagingInfos.some(info =>
          ["BENNE", "CITERNE"].includes(info.type)
        );

        return hasCiterneOrBenne;
      }
    )
    .test(
      "not-defined-if-waste-not-accepted",
      "Vous ne pouvez préciser de retour à vide ADR que si le déchet a été totalement accepté",
      (value, context) => {
        const { wasteAcceptationStatus } = context.parent;

        if (!isDefined(value)) return true;

        return Boolean(wasteAcceptationStatus === "ACCEPTED");
      }
    )
    .test(
      "not-defined-if-waste-not-dangerous",
      "Vous ne pouvez préciser de retour à vide ADR que si le déchet est dangereux",
      (value, context) => {
        const { wasteDetailsIsDangerous, wasteDetailsPop, wasteDetailsCode } =
          context.parent;

        if (!isDefined(value)) return true;

        const wasteIsDangerous =
          wasteDetailsIsDangerous ||
          wasteDetailsPop ||
          isDangerous(wasteDetailsCode);

        return wasteIsDangerous;
      }
    )
    .test(
      "not-defined-if-transport-mode-not-road-nor-null",
      "Vous ne pouvez préciser de retour à vide ADR que si le mode de transport est route (ROAD) ou null",
      (value, context) => {
        const { transporters } = context.parent;

        if (!isDefined(value)) return true;

        const lastTransportMode =
          transporters[transporters.length - 1]?.transporterTransportMode;

        // Tolerate null for legacy BSDs
        return (
          lastTransportMode === TransportMode.ROAD || lastTransportMode === null
        );
      }
    )
});

const withNextDestination = (required: boolean) =>
  yup
    .object()
    .shape({
      nextDestinationProcessingOperation: yup
        .string()
        .required(`Destination ultérieure : ${MISSING_PROCESSING_OPERATION}`)
        .oneOf(
          PROCESSING_AND_REUSE_OPERATIONS_CODES,
          `Destination ultérieure : ${INVALID_PROCESSING_OPERATION}`
        ),
      nextDestinationCompanyName: yup
        .string()
        .max(250)
        .ensure()
        .requiredIf(
          required,
          `Destination ultérieure : ${MISSING_COMPANY_NAME}`
        ),
      nextDestinationCompanySiret: siret
        .label("Destination ultérieure prévue")
        .when(
          [
            "wasteDetailsCode",
            "noTraceability",
            "wasteDetailsPop",
            "wasteDetailsIsDangerous"
          ],
          {
            is: (
              wasteDetailsCode,
              noTraceability,
              wasteDetailsPop,
              wasteDetailsIsDangerous
            ) => {
              // si déchet dangereux sans rupture de traça et entreprise francaise: doit être inscrite sur TD
              // le siret est nullable, required géré par  XORIdRequired",
              const hasNoTraceabilityBreak = !noTraceability;
              const wasteIsDangerous =
                isDangerous(wasteDetailsCode) ||
                wasteDetailsPop ||
                wasteDetailsIsDangerous;

              return wasteIsDangerous && hasNoTraceabilityBreak;
            },
            then: schema =>
              schema
                .test(siretTests.isRegistered("DESTINATION"))
                .test(siretTests.isNotDormant)
          }
        ),

      nextDestinationCompanyVatNumber: vatNumber.label(
        "Destination ultérieure prévue"
      ),
      nextDestinationCompanyAddress: yup
        .string()
        .max(250)
        .ensure()
        .requiredIf(
          required,
          `Destination ultérieure : ${MISSING_COMPANY_ADDRESS}`
        ),
      nextDestinationCompanyCountry: yup
        .string()
        .max(250)
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
        .max(250)
        .ensure()
        .requiredIf(
          required,
          `Destination ultérieure : ${MISSING_COMPANY_CONTACT}`
        ),
      nextDestinationCompanyPhone: yup
        .string()
        .max(20)
        .ensure()
        .requiredIf(
          required,
          `Destination ultérieure : ${MISSING_COMPANY_PHONE}`
        ),
      nextDestinationCompanyMail: yup
        .string()
        .max(250)
        .email()
        .ensure()
        .requiredIf(
          required,
          `Destination ultérieure : ${MISSING_COMPANY_EMAIL}`
        ),
      nextDestinationCompanyExtraEuropeanId: yup.string().max(250).nullable(),
      nextDestinationNotificationNumber: yup
        .string()
        .max(250)
        .when(
          [
            "wasteDetailsCode",
            "wasteDetailsPop",
            "wasteDetailsIsDangerous",
            "nextDestinationCompanyExtraEuropeanId",
            "nextDestinationCompanyVatNumber"
          ],
          {
            is: (
              wasteDetailsCode: string,
              wasteDetailsPop: boolean,
              wasteDetailsIsDangerous: boolean,
              nextDestinationCompanyExtraEuropeanId: string,
              nextDestinationCompanyVatNumber: string
            ) => {
              const isNotFinal = !isFinalOperationCode(wasteDetailsCode);
              const consideredAsDangerous =
                isDangerous(wasteDetailsCode) ||
                wasteDetailsPop ||
                wasteDetailsIsDangerous;

              const isForeignCompany =
                !!nextDestinationCompanyExtraEuropeanId ||
                (!!nextDestinationCompanyVatNumber &&
                  isForeignVat(nextDestinationCompanyVatNumber));

              return isNotFinal && isForeignCompany && consideredAsDangerous;
            },
            then: schema =>
              schema
                .max(
                  15,
                  "Destination ultérieure : Le numéro de notification (format PPAAAADDDRRR) ou le numéro de déclaration Annexe 7 (format A7E AAAA DDDRRR) renseigné ne correspond pas au format attendu."
                )
                .nullable()
                .required(
                  "Destination ultérieure : le numéro de notification est obligatoire"
                ),
            otherwise: schema =>
              schema
                .max(
                  15,
                  "Destination ultérieure : Le numéro de notification (format PPAAAADDDRRR) ou le numéro de déclaration Annexe 7 (format A7E AAAA DDDRRR) renseigné ne correspond pas au format attendu."
                )
                .notRequired()
                .nullable()
          }
        )
    })
    .test(
      "XORIdRequired",
      `Destination ultérieure : ${MISSING_COMPANY_SIRET} (exactement un des identifiants obligatoire, un SIRET ou un numéro TVA intra-communautaire ou un identifiant d'un pays hors Union Européenne)`,
      (obj: Partial<Form>) => {
        const ids = [
          obj.nextDestinationCompanyExtraEuropeanId,
          obj.nextDestinationCompanySiret,
          obj.nextDestinationCompanyVatNumber
        ];
        const definedIds = ids.filter(id => id != null);
        // Check if only one ID is defined
        return !required || definedIds.length === 1;
      }
    );

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
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  nextDestinationCompanyExtraEuropeanId: yup
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
  value: ProcessedInfo & { wasteDetailscode: string }
) => yup.SchemaOf<ProcessedInfo> = value => {
  const base = yup.object({
    processedBy: yup
      .string()
      .max(250)
      .ensure()
      .required("Vous devez saisir un responsable de traitement."),
    processedAt: yup.date().required(),
    processingOperationDone: yup
      .string()
      .oneOf(
        PROCESSING_AND_REUSE_OPERATIONS_CODES,
        INVALID_PROCESSING_OPERATION
      ),
    destinationOperationMode: yup
      .mixed<OperationMode | null | undefined>()
      .oneOf([...Object.values(OperationMode), null, undefined])
      .nullable()
      .test(
        "processing-mode-matches-processing-operation",
        "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie",
        function (item) {
          const { processingOperationDone } = this.parent;
          const destinationOperationMode = item;

          if (processingOperationDone) {
            const modes = getOperationModes(processingOperationDone);

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
    processingOperationDescription: yup.string().max(250).nullable()
  });

  if (
    value?.processingOperationDone &&
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
    const lazyWasteDetailsSchema = wasteDetailsSchemaFn(context).resolve({
      value
    });

    if (value.emitterType === EmitterType.APPENDIX1_PRODUCER) {
      return yup
        .object()
        .concat(emitterSchemaFn(context))
        .concat(lazyWasteDetailsSchema)
        .noUnknown();
    }

    const transporterSchema = transporterSchemaFn(context);

    const pipelineAndTransporterError =
      "Vous ne devez pas spécifier de transporteur dans le cas d'un acheminement direct par pipeline ou convoyeur";

    return yup
      .object()
      .concat(emitterSchemaFn(context))
      .concat(ecoOrganismeSchema)
      .concat(recipientSchemaFn(context))
      .concat(traderSchemaFn(context))
      .concat(brokerSchemaFn(context))
      .concat(lazyWasteDetailsSchema)
      .concat(
        yup.object({
          transporters: yup
            .array<Transporter>()
            .of(transporterSchema)
            .when(
              "wasteDetailsPackagingInfos",
              (wasteDetailsPackagingInfos, schema) =>
                hasPipelinePackaging({ wasteDetailsPackagingInfos })
                  ? schema.length(0, pipelineAndTransporterError)
                  : schema
            )
            .when("isDirectSupply", {
              is: true,
              then: schema => schema.length(0, pipelineAndTransporterError)
            })
            .max(5, "Vous ne pouvez pas ajouter plus de ${max} transporteurs")
        })
      );
  });
export const sealedFormSchema = baseFormSchemaFn({
  isDraft: false,
  signingTransporterOrgId: null
});
export const draftFormSchema = baseFormSchemaFn({
  isDraft: true,
  signingTransporterOrgId: null
});
export const wasteDetailsSchema = wasteDetailsSchemaFn({
  isDraft: false
});

export async function validateBeforeEmission(form: PrismaForm) {
  await wasteDetailsSchemaFn({ isDraft: false }).validate(form);

  if (form.emitterType !== "APPENDIX1_PRODUCER" && !form.isDirectSupply) {
    // Vérifie qu'au moins un packaging a été défini sauf dans le cas
    // d'un bordereau d'annexe 1 pour lequel il est possible de ne pas définir
    // de packaging et dans le cas d'un acheminement direct par pipeline ou
    // convoyeur
    const wasteDetailsBeforeTransportSchema = yup.object({
      wasteDetailsPackagingInfos: yup
        .array()
        .min(1, "Le nombre de contenants doit être supérieur à 0")
    });
    await wasteDetailsBeforeTransportSchema.validate(form);
  }
  return form;
}

export const beforeTransportSchemaFn = ({
  signingTransporterOrgId
}: Pick<FormValidationContext, "signingTransporterOrgId">) =>
  yup.lazy(value => {
    const lazyWasteDetailsSchema = wasteDetailsSchemaFn({
      isDraft: false
    }).resolve({
      value
    });

    const transporterSchema = transporterSchemaFn({ signingTransporterOrgId });

    return yup
      .object()
      .concat(transporterSchemaFn({ signingTransporterOrgId }))
      .concat(lazyWasteDetailsSchema)
      .concat(
        yup.object({
          transporters: yup.array().of(transporterSchema)
        })
      );
  });

export async function validateBeforeTransport(
  form: PrismaForm & { transporters: Transporter[] },
  signingTransporterOrgId: string
) {
  await beforeTransportSchemaFn({ signingTransporterOrgId }).validate(form, {
    abortEarly: false
  });

  const wasteDetailsBeforeTransportSchema = yup.object({
    wasteDetailsPackagingInfos: yup
      .array()
      .min(1, "Le nombre de contenants doit être supérieur à 0"),
    // wasteDetailsQuantity is usually required for the producer signature
    // But for APPENDIX1_PRODUCER, it's only for the transporter signature
    wasteDetailsQuantity: weight(WeightUnits.Tonne).test(
      "is-not-zero",
      "Le poids doit être supérieur à 0",
      value => value != null && value > 0
    )
  });
  await wasteDetailsBeforeTransportSchema.validate(form, { abortEarly: false });

  return form;
}

// validation schema for a BSD with a processed status
export const processedFormSchema = yup.lazy((value: any) =>
  sealedFormSchema
    .resolve({ value })
    .concat(signingInfoSchema)
    .concat(receivedInfoSchema)
    .concat(processedInfoSchemaFn(value))
);

// *******************************************************************
// HELPER FUNCTIONS THAT MAKE USES OF YUP SCHEMAS TO APPLY VALIDATION
// *******************************************************************

export async function checkCanBeSealed(form: PrismaForm) {
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
 * Check that the SIRET appearing on the forwardedIn form match existing
 * companies registered in Trackdechets and that their profile
 * is consistent with the role they play on the form
 * (producer, trader, destination, etc)
 */
export async function validateForwardedInCompanies({
  destinationCompanySiret,
  transporterCompanySiret,
  transporterCompanyVatNumber
}: {
  destinationCompanySiret: string | null | undefined;
  transporterCompanySiret: string | null | undefined;
  transporterCompanyVatNumber: string | null | undefined;
}): Promise<void> {
  if (destinationCompanySiret) {
    await siret
      .label("Destination finale")
      .test(siretTests.isRegistered("DESTINATION"))
      .test(siretTests.isNotDormant)
      .validate(destinationCompanySiret);
  }
  if (transporterCompanySiret) {
    await siret
      .label("Transporteur après entreposage provisoire")
      .test(siretTests.isRegistered("TRANSPORTER"))
      .validate(transporterCompanySiret);
  }
  if (transporterCompanyVatNumber) {
    await foreignVatNumber
      .label("Transporteur après entreposage provisoire")
      .test(vatNumberTests.isRegisteredTransporter)
      .validate(transporterCompanyVatNumber);
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
  form: Partial<PrismaForm | Prisma.FormCreateInput>,
  grouping: InitialFormFractionInput[]
): Promise<
  {
    form: PrismaForm;
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
  form: Partial<PrismaForm | Prisma.FormCreateInput>,
  grouping: InitialFormFractionInput[]
) {
  if (grouping.length > BSDD_MAX_APPENDIX2) {
    throw new UserInputError(
      `Vous ne pouvez pas regrouper plus de ${BSDD_MAX_APPENDIX2} BSDDs initiaux`
    );
  }

  if (!form.emitterCompanySiret) {
    throw new UserInputError(
      "Vous devez renseigner le SIRET de l'établissement de tri, transit, regroupement émettrice du BSDD de regroupement"
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

      const getQuantity = form => {
        const wasteQuantities = bsddWasteQuantities(form);
        return wasteQuantities?.quantityAccepted ?? form.quantityReceived;
      };

      const quantityLeftToGroup = new Decimal(
        initialForm.forwardedIn
          ? getQuantity(initialForm.forwardedIn)
          : getQuantity(initialForm)
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
  form: Partial<PrismaForm | Prisma.FormCreateInput>,
  grouping: InitialFormFractionInput[]
) {
  if (!form.emitterCompanySiret) {
    throw new UserInputError(
      "Vous devez renseigner le SIRET de l'établissement de collecte du BSDD de tournée dédiée"
    );
  }

  const formIds = grouping.map(({ form }) => form.id);
  if (form.status === Status.DRAFT) {
    throw new UserInputError(
      "Impossible de regrouper des BSDD d'annexe 1 sur un bordereau de tournée en brouillon"
    );
  }

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
      quantity: initialForm.quantityReceived?.toNumber() ?? 0
    };
  });

  for (const initialForm of initialForms) {
    if (form.ecoOrganismeSiret || !initialForm.emitterCompanySiret) {
      continue;
    }

    const company = await prisma.company.findFirst({
      where: { orgId: initialForm.emitterCompanySiret },
      select: { id: true }
    });
    if (!company) {
      throw new UserInputError(
        `L'émetteur du bordereau d'annexe 1 ${initialForm.readableId} n'est pas inscrit sur Trackdéchets. Il est impossible de joindre cette annexe à un bordereau chapeau sans éco-organisme.`
      );
    }
  }

  // Once the first appendix has been signed by the transporter,
  // you have maximum 5 calendar days to add and sign new appendix.
  const currentDate = new Date();
  const firstTransporterSignatureDate = initialForms.reduce((date, form) => {
    const { takenOverAt } = form;
    return takenOverAt && takenOverAt < date ? takenOverAt : date;
  }, currentDate);
  const limitDate = sub(currentDate, {
    days: 4, // The 5 days start at 00h00 on the day you sign the first appendix
    hours: currentDate.getHours(),
    minutes: currentDate.getMinutes()
  });
  if (firstTransporterSignatureDate < limitDate) {
    throw new UserInputError(
      `Impossible d'ajouter une annexe 1. Un bordereau de tournée ne peut être utilisé que durant 5 jours consécutifs à partir du moment où la première collecte (transporteur) est signée. La première collecte a été réalisée le ${format(
        firstTransporterSignatureDate,
        "dd/MM/yyyy"
      )}`
    );
  }

  return formFractions;
}

export async function validateIntermediaries(
  intermediaries: CompanyInput[] | null | undefined,
  formContent: ReturnType<typeof flattenFormInput>
) {
  if (!intermediaries || intermediaries.length === 0) {
    return;
  }

  if (formContent.emitterType === "APPENDIX1_PRODUCER") {
    throw new UserInputError(
      "Impossible d'ajouter des intermédiaires sur une annexe 1"
    );
  }

  if (intermediaries.length > 3) {
    throw new UserInputError(
      "Intermédiaires: impossible d'ajouter plus de 3 intermédiaires"
    );
  }

  // check we do not add the same SIRET twice
  const intermediarySirets = intermediaries.map(c => c.siret);

  const hasDuplicate =
    new Set(intermediarySirets).size !== intermediarySirets.length;

  if (hasDuplicate) {
    throw new UserInputError(
      "Intermédiaires: impossible d'ajouter le même établissement en intermédiaire plusieurs fois"
    );
  }

  for (const companyInput of intermediaries) {
    // ensure a SIRET number is present
    await intermediarySchema.validate(companyInput, { abortEarly: false });
  }
}

const formatInitialPlates = (
  transporterNumberPlate: string | null | undefined
): string[] => {
  if (!transporterNumberPlate) {
    return [];
  }
  const regex = /,+|,\s+/;
  const containsComma = regex.test(transporterNumberPlate);
  if (containsComma) {
    return transporterNumberPlate?.split(regex);
  } else {
    if (transporterNumberPlate) {
      return [transporterNumberPlate];
    }
    return [];
  }
};

export const transporterPlatesSchema = transporterSchemaFn({}).pick([
  "transporterNumberPlate"
]);
