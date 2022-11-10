import {
  Consistence,
  EmitterType,
  Form,
  QuantityType,
  WasteAcceptationStatus,
  Prisma,
  CompanyVerificationStatus,
  Status
} from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import prisma from "../prisma";
import countries from "world-countries";
import * as yup from "yup";
import {
  isDangerous,
  PROCESSING_OPERATIONS_CODES,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES,
  BSDD_WASTE_CODES
} from "../common/constants";
import configureYup, { FactorySchemaOf } from "../common/yup/configureYup";
import {
  CompanyInput,
  InitialFormFractionInput,
  PackagingInfo,
  Packagings
} from "../generated/graphql/types";
import {
  isCollector,
  isWasteProcessor,
  isTransporter
} from "../companies/validation";
import {
  MISSING_COMPANY_NAME,
  MISSING_COMPANY_SIRET,
  INVALID_SIRET_LENGTH,
  MISSING_COMPANY_ADDRESS,
  MISSING_COMPANY_CONTACT,
  MISSING_COMPANY_PHONE,
  MISSING_COMPANY_EMAIL,
  INVALID_WASTE_CODE,
  INVALID_PROCESSING_OPERATION,
  EXTRANEOUS_NEXT_DESTINATION,
  MISSING_COMPANY_SIRET_OR_VAT,
  MISSING_PROCESSING_OPERATION,
  MISSING_COMPANY_OMI_NUMBER,
  INVALID_COMPANY_OMI_NUMBER,
  INVALID_INDIVIDUAL_OR_FOREIGNSHIP
} from "./errors";
import {
  isVat,
  isSiret,
  isFRVat,
  isOmi
} from "../common/constants/companySearchHelpers";
import { validateCompany } from "../companies/validateCompany";
import { Decimal } from "decimal.js-light";
// set yup default error messages
configureYup();

const { VERIFY_COMPANY } = process.env;

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

type WasteDetails = Pick<
  Prisma.FormCreateInput,
  | "wasteDetailsCode"
  | "wasteDetailsName"
  | "wasteDetailsOnuCode"
  | "wasteDetailsPackagingInfos"
  | "wasteDetailsQuantity"
  | "wasteDetailsQuantityType"
  | "wasteDetailsConsistence"
  | "wasteDetailsPop"
  | "wasteDetailsParcelNumbers"
  | "wasteDetailsAnalysisReferences"
  | "wasteDetailsLandIdentifiers"
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
>;

// *************************************************************
// DEFINES VALIDATION SCHEMA FOR INDIVIDUAL FRAMES IN BSD PAGE 1
// *************************************************************

const recipientCompanySiretSchema = yup
  .string()
  .ensure()
  .matches(/^$|^\d{14}$/, {
    message: `Destinataire: ${INVALID_SIRET_LENGTH}`
  })
  .test(
    "is-recipient-registered-with-right-profile",
    ({ value }) =>
      `L'installation de destination avec le SIRET ${value} n'est pas inscrite sur Trackdéchets`,
    async (siret, ctx) => {
      if (!siret) return true;

      const company = await prisma.company.findUnique({
        where: { siret }
      });
      if (!company) {
        return false;
      }

      if (!(isCollector(company) || isWasteProcessor(company))) {
        throw ctx.createError({
          message: `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET "${siret}" n'est pas inscrite sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
        });
      }

      if (
        VERIFY_COMPANY === "true" &&
        company.verificationStatus !== CompanyVerificationStatus.VERIFIED
      ) {
        throw ctx.createError({
          message: `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue avec le SIRET ${siret} n'a pas encore été vérifié. Cette installation ne peut pas être visée sur le bordereau bordereau.`
        });
      }

      return true;
    }
  );

const transporterCompanySiretSchema = yup
  .string()
  .ensure()
  .test(
    "is-transporter-registered-with-right-profile",
    ({ value }) =>
      `Le transporteur qui a été renseigné sur le bordereau (SIRET: ${value}) n'est pas inscrit sur Trackdéchets`,
    async (siret, ctx) => {
      if (!siret) return true;

      const company = await prisma.company.findUnique({
        where: { siret }
      });
      if (!company) {
        return false;
      }

      if (!isTransporter(company)) {
        throw ctx.createError({
          message: `Le transporteur saisi sur le bordereau (SIRET: ${siret}) n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport. Cette installation ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
        });
      }

      return true;
    }
  );

// 1 - Émetteur du bordereau
const emitterSchemaFn: FactorySchemaOf<boolean, Emitter> = isDraft =>
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
          .requiredIf(!isDraft, `Émetteur: Le type d'émetteur est obligatoire`),
        otherwise: yup
          .mixed()
          .oneOf(
            ["OTHER", "APPENDIX1", "APPENDIX2"],
            `Émetteur: Le type d'émetteur doit être "OTHER", "APPENDIX1" ou "APPENDIX2" lorsqu'un éco-organisme est responsable du déchet`
          )
      })
      .when("emitterIsPrivateIndividual", {
        is: emitterIsPrivateIndividual => !emitterIsPrivateIndividual,
        then: yup
          .mixed()
          .requiredIf(!isDraft, `Émetteur: Le type d'émetteur est obligatoire`),
        otherwise: yup
          .mixed()
          .oneOf(
            ["PRODUCER"],
            `Émetteur: Le type d'émetteur doit être "PRODUCER" lorsque l'émetteur est un particulier`
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
    emitterCompanySiret: yup
      .string()
      .test(
        "company-siret-with-foreign-ship",
        "Émetteur: vous ne pouvez pas enregistrer un numéro de SIRET en cas d'émetteur navire étranger",
        function (value) {
          const { emitterIsForeignShip } = this.parent;
          if (emitterIsForeignShip === true && value) {
            return false;
          }
          return true;
        }
      )
      .test(
        "company-siret-with-private",
        "Émetteur: vous ne pouvez pas enregistrer un numéro de SIRET en cas d'émetteur particulier",
        function (value) {
          const { emitterIsPrivateIndividual } = this.parent;
          if (emitterIsPrivateIndividual === true && value) {
            return false;
          }
          return true;
        }
      )
      .when("emitterIsForeignShip", (emitterIsForeignShip, schema) =>
        emitterIsForeignShip === true ? schema.notRequired() : schema
      )
      .when(
        "emitterIsPrivateIndividual",
        (emitterIsPrivateIndividual, schema) =>
          emitterIsPrivateIndividual === true ? schema.notRequired() : schema
      )
      .requiredIf(!isDraft, `Émetteur: ${MISSING_COMPANY_SIRET}`)
      .matches(/^$|^\d{14}$/, {
        message: `Émetteur: ${INVALID_SIRET_LENGTH}`
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

// 2 - Installation de destination ou d’entreposage ou de reconditionnement prévue
const recipientSchemaFn: FactorySchemaOf<boolean, Recipient> = isDraft =>
  yup.object({
    recipientCap: yup
      .string()
      .nullable()
      .test(
        "required-when-dangerous",
        "Le champ CAP est obligatoire pour les déchets dangereux",
        (value, testContext) => {
          const rootValue = testContext.parent;
          if (!isDraft && rootValue?.wasteDetailsIsDangerous && !value) {
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
      .requiredIf(!isDraft),
    recipientCompanyName: yup
      .string()
      .ensure()
      .requiredIf(!isDraft, `Destinataire: ${MISSING_COMPANY_NAME}`),
    recipientCompanySiret: recipientCompanySiretSchema.requiredIf(
      !isDraft,
      `Destinataire: ${MISSING_COMPANY_SIRET}`
    ),
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

export const packagingInfoFn = (isDraft: boolean) =>
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
const wasteDetailsSchemaFn: FactorySchemaOf<boolean, WasteDetails> = isDraft =>
  yup.object({
    wasteDetailsName: yup.string().nullable(),
    wasteDetailsCode: yup
      .string()
      .requiredIf(!isDraft, "Le code déchet est obligatoire")
      .oneOf([...BSDD_WASTE_CODES, "", null], INVALID_WASTE_CODE),
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
    wasteDetailsPackagingInfos: yup
      .array()
      .requiredIf(!isDraft, "Le détail du conditionnement est obligatoire")
      .of(packagingInfoFn(isDraft))
      .test(
        "is-valid-packaging-infos",
        "${path} ne peut pas à la fois contenir 1 citerne ou 1 benne et un autre conditionnement.",
        (infos: PackagingInfo[]) => {
          const hasCiterne = infos?.find(i => i.type === "CITERNE");
          const hasBenne = infos?.find(i => i.type === "BENNE");

          if (hasCiterne && hasBenne) {
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
    wasteDetailsQuantity: yup
      .number()
      .requiredIf(!isDraft, "La quantité du déchet en tonnes est obligatoire")
      .min(0, "La quantité doit être supérieure à 0"),
    wasteDetailsQuantityType: yup
      .mixed<QuantityType>()
      .requiredIf(
        !isDraft,
        "Le type de quantité (réelle ou estimée) doit être précisé"
      ),
    wasteDetailsConsistence: yup
      .mixed<Consistence>()
      .requiredIf(!isDraft, "La consistance du déchet doit être précisée"),
    wasteDetailsPop: yup
      .boolean()
      .requiredIf(!isDraft, "La présence (ou non) de POP doit être précisée"),
    wasteDetailsIsDangerous: yup.string().when("wasteDetailsCode", {
      is: (wasteCode: string) => isDangerous(wasteCode || ""),
      then: () =>
        yup
          .boolean()
          .isTrue(
            `Un déchet avec un code comportant un astérisque est forcément dangereux`
          ),
      otherwise: () => yup.boolean()
    }),
    wasteDetailsParcelNumbers: yup.array().of(parcelInfos as any),
    wasteDetailsAnalysisReferences: yup.array().of(yup.string()),
    wasteDetailsLandIdentifiers: yup.array().of(yup.string())
  });

export const wasteDetailsSchema = wasteDetailsSchemaFn(false);

export const beforeSignedByTransporterSchema: yup.SchemaOf<
  Pick<Form, "wasteDetailsPackagingInfos">
> = yup.object({
  wasteDetailsPackagingInfos: yup
    .array()
    .min(1, "Le nombre de contenants doit être supérieur à 0")
});

// 8 - Collecteur-transporteur
export const transporterSchemaFn: FactorySchemaOf<boolean, Transporter> =
  isDraft =>
    yup.object({
      transporterCustomInfo: yup.string().nullable(),
      transporterNumberPlate: yup.string().nullable(),
      transporterCompanyName: yup
        .string()
        .ensure()
        .requiredIf(!isDraft, `Transporteur: ${MISSING_COMPANY_NAME}`),
      transporterCompanySiret: transporterCompanySiretSchema.when(
        "transporterCompanyVatNumber",
        (tva, schema) => {
          if (!tva && !isDraft) {
            return schema
              .required(`Transporteur : ${MISSING_COMPANY_SIRET_OR_VAT}`)
              .test(
                "is-siret",
                "${path} n'est pas un numéro de SIRET valide",
                value => isSiret(value)
              );
          }
          if (!isDraft && tva && isFRVat(tva)) {
            return schema.required(
              "Transporteur : Le numéro SIRET est obligatoire pour un établissement français"
            );
          }
          return schema.nullable().notRequired();
        }
      ),
      transporterCompanyVatNumber: yup
        .string()
        .ensure()
        .test(
          "is-vat",
          "${path} n'est pas un numéro de TVA intracommunautaire valide",
          value => !value || isVat(value)
        ),
      transporterCompanyAddress: yup
        .string()
        .ensure()
        .requiredIf(!isDraft, `Transporteur: ${MISSING_COMPANY_ADDRESS}`),
      transporterCompanyContact: yup
        .string()
        .ensure()
        .requiredIf(!isDraft, `Transporteur: ${MISSING_COMPANY_CONTACT}`),
      transporterCompanyPhone: yup
        .string()
        .ensure()
        .requiredIf(!isDraft, `Transporteur: ${MISSING_COMPANY_PHONE}`),
      transporterCompanyMail: yup
        .string()
        .email()
        .ensure()
        .requiredIf(!isDraft, `Transporteur: ${MISSING_COMPANY_EMAIL}`),
      transporterIsExemptedOfReceipt: yup.boolean().notRequired().nullable(),
      transporterReceipt: yup
        .string()
        .when("transporterIsExemptedOfReceipt", (isExemptedOfReceipt, schema) =>
          isExemptedOfReceipt
            ? schema.notRequired().nullable()
            : schema
                .ensure()
                .requiredIf(
                  !isDraft,
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
                .requiredIf(
                  !isDraft,
                  "Le département du transporteur est obligatoire"
                )
        ),
      transporterValidityLimit: yup.date().nullable()
    });

export const traderSchemaFn: FactorySchemaOf<boolean, Trader> = isDraft =>
  yup.object({
    traderCompanySiret: yup
      .string()
      .notRequired()
      .nullable()
      .matches(/^$|^\d{14}$/, {
        message: `Négociant: ${INVALID_SIRET_LENGTH}`
      }),
    traderCompanyName: yup.string().when("traderCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_NAME}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    traderCompanyAddress: yup.string().when("traderCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_ADDRESS}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    traderCompanyContact: yup.string().when("traderCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_CONTACT}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    traderCompanyPhone: yup.string().when("traderCompanySiret", {
      is: siret => siret?.length === 14,
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
        is: siret => siret?.length === 14,
        then: schema =>
          schema
            .ensure()
            .requiredIf(!isDraft, `Négociant: ${MISSING_COMPANY_EMAIL}`),
        otherwise: schema => schema.notRequired().nullable()
      }),
    traderReceipt: yup.string().when("traderCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, "Négociant: Numéro de récepissé obligatoire"),
      otherwise: schema => schema.notRequired().nullable()
    }),
    traderDepartment: yup.string().when("traderCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, "Négociant : Département obligatoire"),
      otherwise: schema => schema.notRequired().nullable()
    }),
    traderValidityLimit: yup.date().when("traderCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema.requiredIf(!isDraft, "Négociant : Date de validité obligatoire"),
      otherwise: schema => schema.notRequired().nullable()
    })
  });

export const brokerSchemaFn: FactorySchemaOf<boolean, Broker> = isDraft =>
  yup.object({
    brokerCompanySiret: yup
      .string()
      .notRequired()
      .nullable()
      .matches(/^$|^\d{14}$/, {
        message: `Courtier : ${INVALID_SIRET_LENGTH}`
      }),
    brokerCompanyName: yup.string().when("brokerCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_NAME}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerCompanyAddress: yup.string().when("brokerCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_ADDRESS}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerCompanyContact: yup.string().when("brokerCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_CONTACT}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerCompanyPhone: yup.string().when("brokerCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_PHONE}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerCompanyMail: yup.string().when("brokerCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, `Courtier : ${MISSING_COMPANY_EMAIL}`),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerReceipt: yup.string().when("brokerCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, "Courtier : Numéro de récepissé obligatoire"),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerDepartment: yup.string().when("brokerCompanySiret", {
      is: siret => siret?.length === 14,
      then: schema =>
        schema
          .ensure()
          .requiredIf(!isDraft, "Courtier : Département obligatoire"),
      otherwise: schema => schema.notRequired().nullable()
    }),
    brokerValidityLimit: yup.date().when("brokerCompanySiret", {
      is: siret => siret?.length === 14,
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
  quantityReceived: yup
    .number()
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
  wasteAcceptationStatus: yup.mixed<WasteAcceptationStatus>(),
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
        PROCESSING_OPERATIONS_CODES,
        `Destination ultérieure : ${INVALID_PROCESSING_OPERATION}`
      ),
    nextDestinationCompanyName: yup
      .string()
      .ensure()
      .requiredIf(required, `Destination ultérieure : ${MISSING_COMPANY_NAME}`),
    nextDestinationCompanySiret: yup
      .string()
      .when(
        ["nextDestinationCompanyCountry", "nextDestinationCompanyVatNumber"],
        ([country, tva], schema) => {
          if (!tva) {
            return schema
              .ensure()
              .required(
                `Destination ultérieure prévue : ${MISSING_COMPANY_SIRET_OR_VAT}`
              )
              .test(
                "is-siret",
                "Destination ultérieure prévue : ${path} n'est pas un numéro de SIRET valide",
                value => isSiret(value)
              );
          }
          return (country == null || country === "FR") && required
            ? schema
                .ensure()
                .required(
                  `Destination ultérieure prévue : ${MISSING_COMPANY_SIRET}`
                )
                .test(
                  "is-siret",
                  "Destination ultérieure prévue : ${path} n'est pas un numéro de SIRET valide",
                  value => isSiret(value)
                )
            : schema.notRequired().nullable();
        }
      ),
    nextDestinationCompanyVatNumber: yup
      .string()
      .ensure()
      .test(
        "is-vat",
        "${path} n'est pas un numéro de TVA intracommunautaire valide",
        value => !value || isVat(value)
      ),
    nextDestinationCompanyAddress: yup
      .string()
      .ensure()
      .requiredIf(
        required,
        `Destination ultérieure : ${MISSING_COMPANY_ADDRESS}`
      ),
    nextDestinationCompanyCountry: yup.string().oneOf(
      countries.map(country => country.cca2),
      "Destination ultérieure : le code ISO 3166-1 alpha-2 du pays de l'entreprise n'est pas reconnu"
    ),
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
      .requiredIf(required, `Destination ultérieure : ${MISSING_COMPANY_EMAIL}`)
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
const processedInfoSchemaFn: (value: any) => yup.SchemaOf<ProcessedInfo> =
  value => {
    const base = yup.object({
      processedBy: yup
        .string()
        .ensure()
        .required("Vous devez saisir un responsable de traitement."),
      processedAt: yup.date().required(),
      processingOperationDone: yup
        .string()
        .oneOf(PROCESSING_OPERATIONS_CODES, INVALID_PROCESSING_OPERATION),
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
const baseFormSchemaFn = (isDraft: boolean) =>
  emitterSchemaFn(isDraft)
    .concat(ecoOrganismeSchema)
    .concat(recipientSchemaFn(isDraft))
    .concat(wasteDetailsSchemaFn(isDraft))
    .concat(transporterSchemaFn(isDraft))
    .concat(traderSchemaFn(isDraft))
    .concat(brokerSchemaFn(isDraft));

export const sealedFormSchema = baseFormSchemaFn(false);
export const draftFormSchema = baseFormSchemaFn(true);

// validation schema for a BSD with a processed status
export const processedFormSchema = yup.lazy((value: any) =>
  sealedFormSchema
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
    await recipientCompanySiretSchema.validate(
      forwardedIn.recipientCompanySiret
    );
  }
  if (forwardedIn?.transporterCompanySiret) {
    await transporterCompanySiretSchema.validate(
      forwardedIn.transporterCompanySiret
    );
  }
}

/**
 * Constraints on CompanyInput that apply to intermediary company input
 * - SIRET is mandatory
 * - only french companies are allowed
 */
const intermediarySchema: yup.SchemaOf<CompanyInput> = yup.object({
  siret: yup
    .string()
    .required("Intermédiaires: le N° SIRET est obligatoire")
    .test(
      "is-siret",
      "Intermédiaires: le SIRET n'est pas valide (14 chiffres obligatoires)",
      siret => !siret || isSiret(siret)
    ),
  contact: yup
    .string()
    .required("Intermédiaires: les nom et prénom de contact sont obligatoires"),
  vatNumber: yup
    .string()
    .notRequired()
    .nullable()
    .test(
      "is-fr-vat",
      "Intermédiaires: seul les numéros de TVA en France sont valides",
      vat => !vat || (isVat(vat) && isFRVat(vat))
    ),
  address: yup.string().notRequired().nullable(),
  name: yup.string().notRequired().nullable(),
  phone: yup.string().notRequired().nullable(),
  mail: yup.string().notRequired().nullable(),
  country: yup.string().notRequired().nullable(), // ignored in db schema
  omiNumber: yup.string().notRequired().nullable() // ignored in db schema
});

/**
 * Validate Intermediary Input
 * - an intermediary company should be identified by a SIRET (french only) or VAT number
 * - address and name from SIRENE database takes precedence over user input data
 */
export function validateIntermediariesInput(
  companies: CompanyInput[]
): Promise<Prisma.IntermediaryFormAssociationCreateManyFormInput[]> {
  // check we do not add the same SIRET twice
  const intermediarySirets = companies.map(c => c.siret || c.vatNumber);
  const hasDuplicate = intermediarySirets.reduce((acc, curr, idx) => {
    return acc || intermediarySirets.indexOf(curr) !== idx;
  }, false);
  if (hasDuplicate) {
    throw new UserInputError(
      "Intermédiaires: impossible d'ajouter le même établissement en intermédiaire plusieurs fois"
    );
  }

  return Promise.all(
    companies.map(async company => {
      const validated = await validateCompany(
        await intermediarySchema.validate(company)
      );
      return {
        siret: validated.siret,
        vatNumber: validated.vatNumber ?? "",
        name: validated.name ?? "",
        address: validated.address ?? "",
        contact: company.contact ?? "",
        phone: company.phone ?? "",
        mail: company.mail ?? ""
      };
    })
  );
}

const BSDD_MAX_APPENDIX2 = parseInt(process.env.BSDD_MAX_APPENDIX2, 10) || 250;

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
) {
  if (!grouping || grouping?.length === 0) {
    return [];
  }

  if (grouping.length > BSDD_MAX_APPENDIX2) {
    throw new UserInputError(
      `Vous ne pouvez pas regrouper plus de ${BSDD_MAX_APPENDIX2} BSDDs initiaux`
    );
  }

  if (form.emitterType !== EmitterType.APPENDIX2) {
    throw new UserInputError(
      "emitter.type doit être égal à APPENDIX2 lorsque `appendix2Forms` ou `grouping` n'est pas vide"
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
    const quantity = grouping.find(
      formFraction => formFraction.form.id === f.id
    ).quantity;

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
          ? initialForm.forwardedIn.quantityReceived
          : initialForm.quantityReceived
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
          } est de ${quantityLeftToGroup.toFixed(
            3
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
