import { string, object } from "yup";
import countries from "world-countries";
import { isVat } from "generated/constants/companySearchHelpers";

export const companySchema = object().shape({
  name: string().required(),
  siret: string().required(
    "La sélection d'une entreprise par SIRET ou numéro de TVA (si l'entreprise n'est pas française) est obligatoire"
  ),
  vatNumber: string().ensure(),
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

export const transporterCompanySchema = object().shape({
  name: string().required(),
  siret: string().when("vatNumber", {
    is: vatNumber => !vatNumber,
    then: schema =>
      schema.required(
        "La sélection d'une entreprise par SIRET ou numéro de TVA (si l'entreprise n'est pas française) est obligatoire"
      ),
    otherwise: schema => schema.nullable(),
  }),
  vatNumber: string().test(
    "is-vat",
    ({ originalValue }) => `${originalValue} n'est pas un numéro de TVA valide`,
    value => !value || isVat(value)
  ),
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
