import * as Yup from "yup";
import { WASTES_CODES } from "../../common/constants";
import { prisma, Form } from "../../generated/prisma-client";
import { validDatetime } from "../validation";

Yup.setLocale({
  mixed: {
    default: "${path} est invalide",
    required: "${path} est un champ requis et doit avoir une valeur",
    notType: "${path} ne peut pas être null"
  }
} as Yup.LocaleObject);

/**
 * A form must comply with this schema before it can be sealed
 */

export const formSchema = Yup.object().shape({
  emitterType: Yup.string().required(),
  emitterCompanyName: Yup.string()
    .ensure()
    .required("Émetteur: Le nom de l'entreprise est obligatoire"),
  emitterCompanySiret: Yup.string()
    .ensure()
    .required("Émetteur: Le siret de l'entreprise est obligatoire"),
  emitterCompanyAddress: Yup.string()
    .ensure()
    .required("Émetteur: L'adresse de l'entreprise est obligatoire"),
  emitterCompanyContact: Yup.string()
    .ensure()
    .required("Émetteur: Le contact de l'entreprise est obligatoire"),
  emitterCompanyPhone: Yup.string()
    .ensure()
    .required("Émetteur: Le téléphone de l'entreprise est obligatoire"),
  emitterCompanyMail: Yup.string()
    .ensure()
    .required("Émetteur: L'email de l'entreprise est obligatoire"),
  processingOperation: Yup.string()
    .label("Opération d’élimination / valorisation")
    .ensure()
    .required(),
  recipientCompanyName: Yup.string()
    .ensure()
    .required("Destinataire: Le nom de l'entreprise est obligatoire"),
  recipientCompanySiret: Yup.string()
    .ensure()
    .required("Destinataire: Le siret de l'entreprise est obligatoire"),
  recipientCompanyAddress: Yup.string()
    .ensure()
    .required("Destinataire: L'adresse de l'entreprise est obligatoire"),
  recipientCompanyContact: Yup.string()
    .ensure()
    .required("Destinataire: Le contact de l'entreprise est obligatoire"),
  recipientCompanyPhone: Yup.string()
    .ensure()
    .required("Destinataire: Le téléphone de l'entreprise est obligatoire"),
  recipientCompanyMail: Yup.string()
    .ensure()
    .required("Destinataire: L'email de l'entreprise est obligatoire"),
  transporterCompanyName: Yup.string()
    .ensure()
    .required("Transporteur: Le nom de l'entreprise est obligatoire"),
  transporterCompanySiret: Yup.string()
    .ensure()
    .required("Transporteur: Le siret de l'entreprise est obligatoire"),
  transporterCompanyAddress: Yup.string()
    .ensure()
    .required("Transporteur: L'adresse de l'entreprise est obligatoire"),
  transporterCompanyContact: Yup.string()
    .ensure()
    .required("Transporteur: Le contact de l'entreprise est obligatoire"),
  transporterCompanyPhone: Yup.string()
    .ensure()
    .required("Transporteur: Le téléphone de l'entreprise est obligatoire"),
  transporterCompanyMail: Yup.string()
    .ensure()
    .required("Transporteur: L'email de l'entreprise est obligatoire"),
  transporterIsExemptedOfReceipt: Yup.boolean().nullable(true),
  transporterReceipt: Yup.string().when(
    "transporterIsExemptedOfReceipt",
    (isExemptedOfReceipt, schema) =>
      isExemptedOfReceipt
        ? schema.nullable(true)
        : schema
            .ensure()
            .required(
              "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
            )
  ),
  transporterDepartment: Yup.string().when(
    "transporterIsExemptedOfReceipt",
    (isExemptedOfReceipt, schema) =>
      isExemptedOfReceipt
        ? schema.nullable(true)
        : schema
            .ensure()
            .required("Le département du transporteur est obligatoire")
  ),
  transporterValidityLimit: validDatetime(
    { verboseFieldName: "date de validité" },
    Yup
  ),
  wasteDetailsCode: Yup.string().oneOf(
    WASTES_CODES,
    "Le code déchet est obligatoire et doit appartenir à la liste  du code de l'environnement (par exemple 16 11 05*)"
  ),
  wasteDetailsOnuCode: Yup.string(),
  wasteDetailsPackagings: Yup.array().ensure().required(),
  wasteDetailsNumberOfPackages: Yup.number()
    .integer()
    .min(1, "Le nombre de colis doit être supérieur à 0")
    .nullable(true),
  wasteDetailsQuantity: Yup.number().min(
    0,
    "La quantité doit être supérieure à 0"
  ),
  wasteDetailsQuantityType: Yup.string()
    .ensure()
    .required("Le type de quantité (réelle ou estimée) doit être précisé"),
  wasteDetailsConsistence: Yup.string()
    .ensure()
    .required("La consistance du déchet doit être précisée"),
  ecoOrganisme: Yup.object().when("emitterType", {
    is: e => e === "OTHER",
    otherwise: Yup.object()
      .test(
        "is-not-set",
        "${path} ne peut avoir une valeur que si l'émetteur est de type `Autre détenteur`",
        value => value?.id == null
      )
      .nullable()
  }),
  temporaryStorageDetail: Yup.object().when("recipientIsTempStorage", {
    is: e => e === true,
    otherwise: Yup.object()
      .test(
        "is-not-set",
        "${path} ne peut avoir une valeur que si recipientIsTempStorage === true",
        value => value?.id == null
      )
      .nullable()
  })
});

export async function validateForm(form: Form) {
  const ecoOrganisme = await prisma.form({ id: form.id }).ecoOrganisme();
  const temporaryStorageDetail = await prisma
    .form({ id: form.id })
    .temporaryStorageDetail();

  const isValid = await formSchema.isValid({
    ...form,
    ecoOrganisme,
    temporaryStorageDetail
  });
  return isValid ? Promise.resolve() : Promise.reject();
}
