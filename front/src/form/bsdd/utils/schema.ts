import {
  string,
  object,
  date,
  number,
  array,
  boolean,
  setLocale,
  mixed,
  SchemaOf,
} from "yup";

import { isDangerous } from "generated/constants";
import {
  PackagingInfo,
  Packagings,
  Consistence,
  WasteAcceptationStatus,
  CompanyType,
  CompanyInput,
} from "generated/graphql/types";
import graphlClient from "graphql-client";
import { COMPANY_INFOS_REGISTERED_VALIDATION_SCHEMA } from "Apps/common/queries/company/query";
import {
  isVat,
  isFRVat,
  isSiret,
} from "generated/constants/companySearchHelpers";
import {
  companySchema,
  transporterCompanySchema,
} from "common/validation/schema";

setLocale({
  mixed: {
    notType: "Ce champ ne peut pas être nul",
  },
});

// Destination should be a company registered in TD with profile COLLECTOR or WASTEPROCESSOR
const companyRegistrationAndTypeSchema = companySchema.concat(
  object().shape({
    siret: string().test(
      "is-registered-test",
      `Cet établissement n'est pas inscrit sur Trackdéchets ou son profil
    ne lui permet pas d'être destinataire du bordereau. Seuls les établissements
    inscrits sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement
    peuvent apparaitre en tant que destinataire sur le bordereau`,
      async value => {
        if (value) {
          const { data } = await graphlClient.query({
            query: COMPANY_INFOS_REGISTERED_VALIDATION_SCHEMA,
            variables: { siret: value },
          });
          // it should be registered to TD
          if (data.companyInfos?.isRegistered === false) {
            return false;
          }
          if (data.companyInfos?.companyTypes) {
            // it should be COLLECTOR or WASTEPROCESSOR
            return data.companyInfos?.companyTypes.some(companyType =>
              [CompanyType.Collector, CompanyType.Wasteprocessor].includes(
                companyType
              )
            );
          }
        }
        return true;
      }
    ),
  })
);

export const transporterSchema = object().shape({
  isExemptedOfReceipt: boolean().nullable(true),
  numberPlate: string().nullable(true),
  company: transporterCompanySchema,
});

const packagingInfo: SchemaOf<Omit<PackagingInfo, "__typename">> =
  object().shape({
    type: mixed<Packagings>().required(
      "Le type de conditionnement doit être précisé."
    ),
    other: string()
      .ensure()
      .when("type", (type, schema) =>
        type === "AUTRE"
          ? schema.required(
              "La description doit être précisée pour le conditionnement 'AUTRE'."
            )
          : schema
              .nullable()
              .max(
                0,
                "Le description du conditionnement ne peut être renseignée que lorsque le type de conditionnement est 'AUTRE'."
              )
      ),
    quantity: number()
      .required(
        "Le nombre de colis associés au conditionnement doit être précisé."
      )
      .integer()
      .min(1, "Le nombre de colis doit être supérieur à 0.")
      .when("type", (type, schema) =>
        ["CITERNE", "BENNE"].includes(type)
          ? schema.max(
              2,
              "Le nombre de benne(s) ou de citerne(s) ne peut être supérieur à 2."
            )
          : schema
      ),
  });

const intermediariesShape: SchemaOf<Omit<CompanyInput, "__typename">> =
  object().shape({
    siret: string()
      .required("Intermédiaires: le N° SIRET est obligatoire")
      .test(
        "is-siret",
        "Intermédiaires: le SIRET n'est pas valide (14 chiffres obligatoires)",
        siret =>
          !siret ||
          isSiret(siret, import.meta.env.VITE_ALLOW_TEST_COMPANY === "true")
      ),
    contact: string().required(
      "Intermédiaires: les nom et prénom de contact sont obligatoires"
    ),
    vatNumber: string()
      .notRequired()
      .nullable()
      .test(
        "is-fr-vat",
        "Intermédiaires: seul les numéros de TVA en France sont valides",
        vat => !vat || (isVat(vat) && isFRVat(vat))
      ),
    address: string().notRequired().nullable(),
    name: string().notRequired().nullable(),
    phone: string().notRequired().nullable(),
    mail: string().notRequired().nullable(),
    country: string().notRequired().nullable(), // ignored only for compat with CompanyInput
    omiNumber: string().notRequired().nullable(), // ignored only for compat with CompanyInput
    orgId: string().notRequired().nullable(), // ignored only for compat with CompanyInput
  });

export const formSchema = object().shape({
  id: string().required(),
  emitter: object().shape({
    type: string().matches(/(PRODUCER|OTHER|APPENDIX2)/),
    workSite: object().notRequired().nullable().shape({
      name: string().nullable(),
      address: string().nullable(),
      city: string().nullable(),
      postalCode: string().nullable(),
      infos: string().nullable(),
    }),
    company: companySchema,
  }),
  ecoOrganisme: object().notRequired().nullable().shape({
    name: string().required(),
    siret: string().required(),
  }),
  recipient: object().shape({
    processingOperation: string()
      .required()
      .test(
        "selected",
        "Vous devez sélectionner une valeur",
        (v: string | undefined) => v !== ""
      ),
    cap: string()
      .nullable(true)
      .test(
        "required-when-dangerous",
        "Le champ CAP est obligatoire pour les déchets dangereux",
        (value, testContext) => {
          const from = (testContext as any).from; // Typings are still missing from the lib. Original PR here https://github.com/jquense/yup/pull/556
          const { value: rootValue } = from[1]; // from is an array of parents. Each index goes one step further. Root is 2 steps away so its from[1]

          if (rootValue?.wasteDetails?.code?.includes("*") && !value) {
            return false;
          }
          return true;
        }
      ),
    company: companyRegistrationAndTypeSchema,
  }),
  transporter: transporterSchema,
  trader: object()
    .notRequired()
    .nullable()
    .shape({
      company: companySchema,
      validityLimit: date().required(
        "La date de limite de validité est obligatoire"
      ),
      department: string().required("Le département est obligatoire"),
      receipt: string().required("Le numéro de récépissé est obligatoire"),
    }),
  broker: object()
    .notRequired()
    .nullable()
    .shape({
      company: companySchema,
      validityLimit: date().required(
        "La date de limite de validité est obligatoire"
      ),
      department: string().required("Le département est obligatoire"),
      receipt: string().required("Le numéro de récépissé est obligatoire"),
    }),
  wasteDetails: object().shape({
    code: string().required("Code déchet manquant"),
    name: string().nullable(true),
    onuCode: string().when("code", {
      is: (wasteCode: string) => isDangerous(wasteCode || ""),
      then: () =>
        string()
          .ensure()
          .required(
            `La mention ADR est obligatoire pour les déchets dangereux. Merci d'indiquer "non soumis" si nécessaire.`
          ),
      otherwise: () => string().nullable(),
    }),
    packagingInfos: array()
      .required()
      .min(1)
      .of(packagingInfo)
      .test(
        "is-valid-packaging-infos",
        "Le conditionnement ne peut pas à la fois contenir 1 citerne ou 1 benne et un autre conditionnement.",
        infos => {
          const hasCiterne = infos?.find(i => i.type === "CITERNE") != null;
          const hasBenne = infos?.find(i => i.type === "BENNE") != null;

          if (hasCiterne && hasBenne) {
            return false;
          }

          const hasOtherPackaging = infos?.find(
            i => i.type && !["CITERNE", "BENNE"].includes(i.type)
          );
          if ((hasCiterne || hasBenne) && hasOtherPackaging) {
            return false;
          }

          return true;
        }
      ),
    quantity: number().min(0, "La quantité doit être supérieure à 0"),
    quantityType: string().matches(
      /(REAL|ESTIMATED)/,
      "Le type de quantité (réelle ou estimée) doit être précisé"
    ),
    consistence: string().oneOf(
      Object.values(Consistence),
      "La consistance du déchet doit être précisée"
    ),
  }),
  temporaryStorageDetail: object()
    .notRequired()
    .nullable()
    .shape({
      destination: object().notRequired().nullable().shape({
        company: companyRegistrationAndTypeSchema,
      }),
    }),
  intermediaries: array().required().min(0).of(intermediariesShape),
});

export const receivedFormSchema = object().shape({
  receivedBy: string().required("Le champ est requis"),
  receivedAt: date().required("Le champ est requis"),
  wasteAcceptationStatus: string().oneOf([
    WasteAcceptationStatus.Accepted,
    WasteAcceptationStatus.Refused,
    WasteAcceptationStatus.PartiallyRefused,
  ]),
  quantityReceived: number()
    .required("Le champ est requis et doit être un nombre")
    .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
      [WasteAcceptationStatus.Refused].includes(wasteAcceptationStatus)
        ? schema.test(
            "is-zero",
            "Le champ doit être à 0 si le déchet est refusé",
            v => v === 0
          )
        : schema.moreThan(0, "Le champ doit être un nombre supérieur à 0")
    ),

  wasteRefusalReason: string().when(
    "wasteAcceptationStatus",
    (wasteAcceptationStatus, schema) =>
      [
        WasteAcceptationStatus.Refused,
        WasteAcceptationStatus.PartiallyRefused,
      ].includes(wasteAcceptationStatus)
        ? schema.required("Le champ doit être renseigné")
        : schema.test(
            "is-empty",
            "Le champ ne doit pas être renseigné si le déchet est accepté",
            v => !v
          )
  ),
});
