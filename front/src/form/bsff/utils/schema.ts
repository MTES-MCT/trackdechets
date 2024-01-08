import * as yup from "yup";
import {
  companySchema,
  transporterCompanySchema
} from "../../../common/validation/schema";
import { BsffPackagingType } from "@td/codegen-ui";
import { OPERATION } from "./constants";

export const transporterSchema = yup.object().shape({
  isExemptedOfReceipt: yup.boolean().nullable(true),
  numberPlate: yup.string().nullable(true),
  company: transporterCompanySchema
});

const destinationSchema = yup.object().shape({
  company: companySchema,
  plannedOperationCode: yup
    .string()
    .ensure()
    .oneOf(
      ["", ...Object.keys(OPERATION)],
      "Le code de l'opération de traitement / valorisation prévue est invalide"
    )
    .min(1, "Champ requis")
});

export const validationSchema = yup.object({
  emitter: yup.object().shape({ company: companySchema }),
  waste: yup.object({
    code: yup.string().required(),
    description: yup.string().required()
  }),
  packagings: yup
    .array(
      yup.object({
        type: yup
          .mixed<BsffPackagingType>()
          .required("Conditionnements : le type de contenant est requis"),
        other: yup
          .string()
          .when("type", (type, schema) =>
            type === "AUTRE"
              ? schema.required(
                  "La description doit être précisée pour le conditionnement 'Autre'."
                )
              : schema
                  .nullable()
                  .max(
                    0,
                    "La description ne peut être renseignée que lorsque le type de conditionnement est 'AUTRE'."
                  )
          ),
        numero: yup
          .string()
          .required("Le numéro du contenant est un champ requis"),
        volume: yup
          .number()
          .nullable()
          .notRequired()
          .positive("Le volume du contenant doit être supérieur 0"),
        weight: yup
          .number()
          .nullable()
          .required("Le poids du contenu est un champ requis")
          .positive("La masse du contenu doit être supérieur 0")
      })
    )
    .min(1, "Le nombre de contenants doit être supérieur ou égal à 1"),
  weight: yup.object().shape({
    value: yup
      .number()
      .required()
      .positive("La quantité totale doit être supérieure à 0")
  }),
  transporter: transporterSchema,
  destination: destinationSchema
});
