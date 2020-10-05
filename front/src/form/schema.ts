import {
  string,
  object,
  date,
  number,
  array,
  boolean,
  setLocale,
  LocaleObject,
  StringSchema,
} from "yup";
import countries from "world-countries";

import { isDangerous } from "src/generated/constants";
import { WasteAcceptationStatusInput as WasteAcceptationStatus } from "src/generated/graphql/types";

setLocale({
  mixed: {
    notType: "Ce champ ne peut pas être nul",
  },
} as LocaleObject);

const companySchema = object().shape({
  name: string().required(),
  siret: string().when("country", {
    is: country => country == null || country === "FR",
    then: string().required("La sélection d'une entreprise est obligatoire"),
    otherwise: string().nullable(),
  }),
  address: string().required(),
  country: string()
    .oneOf([
      ...countries.map(country => country.cca2),

      // .oneOf() has a weird behavior with .nullable(), see:
      // https://github.com/jquense/yup/issues/104
      null,
    ])
    .nullable(),
  contact: string().required("Le contact dans l'entreprise est obligatoire"),
  phone: string().required("Le téléphone de l'entreprise est obligatoire"),
  mail: string()
    .email("Le format d'adresse email est incorrect")
    .required("L'email est obligatoire"),
});

const packagingSchema = string().matches(/(FUT|GRV|CITERNE|BENNE|AUTRE)/);

export const formSchema = object().shape({
  id: string().required(),
  emitter: object().shape({
    type: string().matches(/(PRODUCER|OTHER|APPENDIX2)/),
    workSite: object({
      name: string().nullable(),
      address: string().nullable(),
      city: string().nullable(),
      postalCode: string().nullable(),
      infos: string().nullable(),
    }).nullable(),
    company: companySchema,
  }),
  recipient: object().shape({
    processingOperation: string()
      .required()
      .test(
        "selected",
        "Vous devez sélectionner une valeur",
        (v: string) => v !== ""
      ),
    cap: string().nullable(true),
    company: companySchema,
  }),
  transporter: object().shape({
    isExemptedOfReceipt: boolean().nullable(true),
    receipt: string().when(
      "isExemptedOfReceipt",
      (isExemptedOfReceipt: boolean, schema: StringSchema) =>
        isExemptedOfReceipt
          ? schema.nullable(true)
          : schema.required(
              "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
            )
    ),
    department: string().when(
      "isExemptedOfReceipt",
      (isExemptedOfReceipt: boolean, schema: StringSchema) =>
        isExemptedOfReceipt
          ? schema.nullable(true)
          : schema.required("Le département du transporteur est obligatoire")
    ),
    validityLimit: date().nullable(true),
    numberPlate: string().nullable(true),
    company: companySchema,
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
    packagings: array().of(packagingSchema),
    otherPackaging: string().nullable(true),
    numberOfPackages: number()
      .integer()
      .min(1, "Le nombre de colis doit être supérieur à 0")
      .nullable(true),
    quantity: number().min(0, "La quantité doit être supérieure à 0"),
    quantityType: string().matches(
      /(REAL|ESTIMATED)/,
      "Le type de quantité (réelle ou estimée) doit être précisé"
    ),
    consistence: string().matches(
      /(SOLID|LIQUID|GASEOUS)/,
      "La consistance du déchet doit être précisée"
    ),
  }),
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
