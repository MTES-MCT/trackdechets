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
  mixed,
  ObjectSchema,
} from "yup";
import countries from "world-countries";

import { isDangerous } from "generated/constants";
import {
  PackagingInfo,
  Packagings,
  WasteAcceptationStatusInput as WasteAcceptationStatus,
} from "generated/graphql/types";

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

const packagingInfo: ObjectSchema<PackagingInfo> = object().shape({
  type: mixed<Packagings>().required(
    "Le type de conditionnement doit être précisé."
  ),
  other: string().when("type", (type, schema) =>
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
      "Le nombre de colis associé au conditionnement doit être précisé."
    )
    .integer()
    .min(1, "Le nombre de colis doit être supérieur à 0.")
    .when("type", (type, schema) =>
      ["CITERNE", "BENNE"].includes(type)
        ? schema.max(
            1,
            "Le nombre de benne ou de citerne ne peut être supérieur à 1."
          )
        : schema
    ),
});

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
    packagingInfos: array()
      .required()
      .of(packagingInfo)
      .test(
        "is-valid-packaging-infos",
        "Le conditionnement ne peut pas à la fois contenir 1 citerne ou 1 benne et un autre conditionnement.",
        (infos: PackagingInfo[]) => {
          const hasCiterne = infos?.find(i => i.type === "CITERNE") != null;
          const hasBenne = infos?.find(i => i.type === "BENNE") != null;

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
    quantity: number().min(0, "La quantité doit être supérieure à 0"),
    quantityType: string().matches(
      /(REAL|ESTIMATED)/,
      "Le type de quantité (réelle ou estimée) doit être précisé"
    ),
    consistence: string().matches(
      /(SOLID|LIQUID|GASEOUS|DOUGHY)/,
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
