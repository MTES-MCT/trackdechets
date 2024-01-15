import * as yup from "yup";
import countries from "world-countries";
import { isOmi, isVat } from "@td/constants";

/**
 * Company Schema for the general case (FR company)
 */
export const companySchema = yup.object().shape({
  name: yup.string().required(),
  siret: yup.string().when("country", {
    is: country => country === null || country === "FR",
    then: yup
      .string()
      .required("La sélection d'une entreprise est obligatoire"),
    otherwise: yup.string().nullable()
  }),
  vatNumber: yup
    .string()
    .nullable()
    .test(
      "is-vat",
      ({ originalValue }) =>
        `${originalValue} n'est pas un numéro de TVA valide`,
      value => !value || isVat(value)
    ),
  address: yup.string().required("L'adresse de l'entreprise est requis"),
  country: yup
    .string()
    .oneOf([
      ...countries.map(country => country.cca2),

      // .oneOf() has a weird behavior with .nullable(), see:
      // https://github.com/jquense/yup/issues/104
      null
    ])
    .nullable(),
  contact: yup
    .string()
    .nullable()
    .required("Le contact dans l'entreprise est obligatoire"),
  phone: yup
    .string()
    .nullable()
    .required("Le téléphone de l'entreprise est obligatoire"),
  mail: yup
    .string()
    .email("Le format d'adresse email est incorrect")
    .nullable()
    .required("L'email est obligatoire"),
  omiNumber: yup
    .string()
    .nullable()
    .test(
      "is-omi",
      ({ originalValue }) => `${originalValue} n'est pas un numéro OMI valide`,
      value => !value || isOmi(value)
    )
});

/**
 * Transporter Company Schema (FR or foreign)
 */
export const transporterCompanySchema = companySchema.concat(
  yup.object().shape({
    siret: yup.string().when("vatNumber", {
      is: vatNumber => !vatNumber,
      then: schema =>
        schema.required(
          "La sélection d'une entreprise par SIRET ou numéro de TVA (si l'entreprise n'est pas française) est obligatoire"
        ),
      otherwise: schema => schema.nullable()
    })
  })
);
