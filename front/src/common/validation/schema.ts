import * as yup from "yup";
import countries from "world-countries";
import { isOmi, isVat } from "generated/constants/companySearchHelpers";
import { CompanyInput } from "generated/graphql/types";

export const companySchema: yup.SchemaOf<CompanyInput> = yup.object().shape({
  name: yup.string().required(),
  siret: yup
    .string()
    .required("La sélection d'une entreprise par SIRET est obligatoire"),
  vatNumber: yup.string().test(
    "is-vat",
    ({ originalValue }) => `${originalValue} n'est pas un numéro de TVA valide`,
    value => !value || isVat(value)
  ),
  address: yup.string().required("L'adresse de l'entreprise est requis"),
  country: yup
    .string()
    .oneOf([
      ...countries.map(country => country.cca2),

      // .oneOf() has a weird behavior with .nullable(), see:
      // https://github.com/jquense/yup/issues/104
      null,
    ])
    .nullable(),
  contact: yup.string().required("Le contact dans l'entreprise est requis"),
  phone: yup.string().required("Le téléphone de l'entreprise est requis"),
  mail: yup
    .string()
    .email("Le format d'adresse email est incorrect")
    .required("L'email de contact est requis"),
  omiNumber: yup
    .string()
    .nullable()
    .test(
      "is-omi",
      ({ originalValue }) => `${originalValue} n'est pas un numéro OMI valide`,
      value => !value || isOmi(value)
    ),
});

export const transporterCompanySchema = companySchema.concat(
  yup.object().shape({
    siret: yup.string().when("vatNumber", {
      is: vatNumber => !vatNumber,
      then: schema =>
        schema.required(
          "La sélection d'une entreprise par SIRET ou numéro de TVA (si l'entreprise n'est pas française) est obligatoire"
        ),
      otherwise: schema => schema.nullable(),
    }),
    vatNumber: yup.string().test(
      "is-vat",
      ({ originalValue }) =>
        `${originalValue} n'est pas un numéro de TVA valide`,
      value => !value || isVat(value)
    ),
  })
);
