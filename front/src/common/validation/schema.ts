import { string, object } from "yup";
import countries from "world-countries";

export const companySchema = object().shape({
  name: string().required(),
  siret: string()
    .when("vatNumber", {
      is: vatNumber => !vatNumber,
      then: string().required(
        "La sélection d'une entreprise par SIRET ou numéro de TVA (si l'entreprise n'est pas française) est obligatoire"
      ),
      otherwise: string().nullable(),
    })
    .when("country", {
      is: country => country == null || country === "FR",
      then: string().required("La sélection d'une entreprise est obligatoire"),
      otherwise: string().nullable(),
    }),
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
