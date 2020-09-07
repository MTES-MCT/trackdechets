import * as Yup from "yup";
import {
  array,
  boolean,
  LocaleObject,
  number,
  object,
  setLocale,
  string
} from "yup";
import { WASTES_CODES } from "../../common/constants";
import { prisma, Form } from "../../generated/prisma-client";
import { validDatetime } from "../validation";
import { expandFormFromDb } from "../form-converter";
import countries from "world-countries";

setLocale({
  mixed: {
    default: "${path} est invalide",
    required: "${path} est un champ requis et doit avoir une valeur",
    notType: "${path} ne peut pas être null"
  }
} as LocaleObject);

/**
 * A form must comply with this schema before it can be sealed
 */
export const formSchema = object<any>().shape({
  id: string().label("Identifiant (id)").required(),
  emitter: object().shape({
    type: string().required(),
    workSite: object({
      name: string().nullable(),
      address: string().nullable(),
      city: string().nullable(),
      postalCode: string().nullable(),
      infos: string().nullable()
    }).nullable(),
    company: validCompany({ verboseFieldName: "Émetteur" })
  }),
  recipient: object().shape({
    processingOperation: string()
      .label("Opération d’élimination / valorisation")
      .required(),
    cap: string().nullable(true),
    company: validCompany({ verboseFieldName: "Destinataire" }),
    isTempStorage: boolean()
  }),
  transporter: object().shape({
    isExemptedOfReceipt: boolean().nullable(true),
    receipt: string().when(
      "isExemptedOfReceipt",
      (isExemptedOfReceipt, schema) =>
        isExemptedOfReceipt
          ? schema.nullable(true)
          : schema.required(
              "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
            )
    ),
    department: string().when(
      "isExemptedOfReceipt",
      (isExemptedOfReceipt, schema) =>
        isExemptedOfReceipt
          ? schema.nullable(true)
          : schema.required("Le département du transporteur est obligatoire")
    ),
    validityLimit: validDatetime({ verboseFieldName: "date de validité" }, Yup),
    numberPlate: string().nullable(true),
    company: validCompany({ verboseFieldName: "Transporteur" })
  }),
  wasteDetails: object().shape({
    code: string().oneOf(
      WASTES_CODES,
      "Le code déchet est obligatoire et doit appartenir à la liste  du code de l'environnement (par exemple 16 11 05*)"
    ),
    onuCode: string(),
    packagings: array().required(),
    otherPackaging: string().nullable(true),
    numberOfPackages: number()
      .integer()
      .min(1, "Le nombre de colis doit être supérieur à 0")
      .nullable(true),
    quantity: number().min(0, "La quantité doit être supérieure à 0"),
    quantityType: string().required(
      "Le type de quantité (réelle ou estimée) doit être précisé"
    ),
    consistence: string().required(
      "La consistance du déchet doit être précisée"
    )
  }),
  ecoOrganisme: object().when("emitter", {
    is: e => e.type === "OTHER",
    then: object({ id: string().nullable() })
      .test(
        "is-unknown",
        "${path} n'est pas un éco-organisme connu par Trackdéchet. (Si vous pensez que c'est une erreur, contactez le support)",
        value => {
          if (!value.id) {
            return true;
          }
          return prisma.$exists.ecoOrganisme(value.id);
        }
      )
      .nullable(),
    otherwise: object()
      .test(
        "is-not-set",
        "${path} ne peut avoir une valeur que si l'émetteur est de type `Autre détenteur`",
        value => value?.id == null
      )
      .nullable()
  }),
  temporaryStorageDetail: object().when("recipient", {
    is: e => e.isTempStorage,
    then: object({
      destination: object({
        company: object({
          name: string().nullable(),
          siret: string().nullable(),
          address: string().nullable(),
          contact: string().nullable(),
          phone: string().nullable(),
          mail: string().nullable()
        }).nullable(),
        processingOperation: string()
          .label("Opération d’élimination / valorisation")
          .nullable(),
        cap: string().nullable(true)
      })
    }),
    otherwise: object().nullable()
  })
});

export async function validateForm(form: Form) {
  const formattedForm = expandFormFromDb(form);
  const isValid = await formSchema.isValid(formattedForm);
  return isValid ? Promise.resolve() : Promise.reject();
}

export function validCompany({
  verboseFieldName,
  allowForeign = false
}: {
  verboseFieldName: string;
  allowForeign?: boolean;
}) {
  return Yup.object().shape({
    name: Yup.string().required(
      `${verboseFieldName}: Le nom de l'entreprise est obligatoire`
    ),
    siret: allowForeign
      ? Yup.string().when("country", {
          is: country => country == null || country === "FR",
          then: Yup.string().required(
            `${verboseFieldName}: La sélection d'une entreprise par SIRET est obligatoire`
          ),
          otherwise: Yup.string().nullable()
        })
      : Yup.string().required(
          `${verboseFieldName}: La sélection d'une entreprise par SIRET est obligatoire`
        ),
    address: Yup.string().required(
      `${verboseFieldName}: L'adresse d'une entreprise est obligatoire`
    ),
    country: allowForeign
      ? Yup.string()
          .oneOf(
            [
              ...countries.map(country => country.cca2),

              // .oneOf() has a weird behavior with .nullable(), see:
              // https://github.com/jquense/yup/issues/104
              null
            ],
            `${verboseFieldName}: Le code ISO 3166-1 alpha-2 du pays de l'entreprise n'est pas reconnu`
          )
          .nullable()
      : Yup.string()
          .oneOf(
            ["FR", null],
            `${verboseFieldName}: Cette entreprise ne peut pas être à l'étranger`
          )
          .nullable(),
    contact: Yup.string().required(
      `${verboseFieldName}: Le contact dans l'entreprise est obligatoire`
    ),
    phone: Yup.string().required(
      `${verboseFieldName}: Le téléphone de l'entreprise est obligatoire`
    ),
    mail: Yup.string().required(
      `${verboseFieldName}: L'email de l'entreprise est obligatoire`
    )
  });
}
