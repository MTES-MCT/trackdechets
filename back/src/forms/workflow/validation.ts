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
import { prisma } from "../../generated/prisma-client";
import { validDatetime } from "../validation";

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
    company: validCompany({ verboseFieldName: "Émetteur" }, Yup)
  }),
  recipient: object().shape({
    processingOperation: string()
      .label("Opération d’élimination / valorisation")
      .required(),
    cap: string().nullable(true),
    company: validCompany({ verboseFieldName: "Destinataire" }, Yup),
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
    company: validCompany({ verboseFieldName: "Transporteur" }, Yup)
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

function validCompany({ verboseFieldName }, yup) {
  return yup.object().shape({
    name: yup
      .string()
      .required(`${verboseFieldName}: Le nom de l'entreprise est obligatoire`),
    siret: yup
      .string()
      .required(
        `${verboseFieldName}: La sélection d'une entreprise par SIRET est obligatoire`
      ),
    address: yup
      .string()
      .required(
        `${verboseFieldName}: L'adresse d'une entreprise est obligatoire`
      ),
    contact: yup
      .string()
      .required(
        `${verboseFieldName}: Le contact dans l'entreprise est obligatoire`
      ),
    phone: yup
      .string()
      .required(
        `${verboseFieldName}: Le téléphone de l'entreprise est obligatoire`
      ),
    mail: yup
      .string()
      .required(`${verboseFieldName}: L'email de l'entreprise est obligatoire`)
  });
}
