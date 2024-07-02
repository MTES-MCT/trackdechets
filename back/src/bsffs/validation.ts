import * as yup from "yup";
import { Prisma } from "@prisma/client";
import configureYup from "../common/yup/configureYup";
import {
  siret,
  siretConditions,
  weight,
  WeightUnits
} from "../common/validation";

configureYup();

export const ficheInterventionSchema: yup.SchemaOf<
  Pick<
    Prisma.BsffFicheInterventionUpdateInput,
    | "numero"
    | "weight"
    | "postalCode"
    | "detenteurCompanyName"
    | "detenteurCompanySiret"
    | "detenteurCompanyAddress"
    | "detenteurCompanyContact"
    | "detenteurCompanyPhone"
    | "detenteurCompanyMail"
    | "detenteurIsPrivateIndividual"
    | "operateurCompanyName"
    | "operateurCompanySiret"
    | "operateurCompanyAddress"
    | "operateurCompanyContact"
    | "operateurCompanyPhone"
    | "operateurCompanyMail"
  >
> = yup.object({
  numero: yup
    .string()
    .required("Le numéro de la fiche d'intervention est requis"),
  weight: weight(WeightUnits.Kilogramme).required(
    "Le poids en kilogramme est requis"
  ),
  postalCode: yup
    .string()
    .required("Le code postal du lieu de l'intervention est requis"),
  detenteurIsPrivateIndividual: yup.boolean() as any,
  detenteurCompanySiret: siret
    .label("Détenteur")
    .required("Le SIRET de l'entreprise détentrice de l'équipement est requis")
    .when(
      "detenteurIsPrivateIndividual",
      siretConditions.isPrivateIndividual as any
    ),
  detenteurCompanyName: yup
    .string()
    .ensure()
    .when("detenteurIsPrivateIndividual", {
      is: true,
      then: schema =>
        schema.required(
          "Le nom du détenteur de l'équipement (particulier) est requis"
        ),
      otherwise: schema =>
        schema.required(
          "Le nom de l'entreprise détentrice de l'équipement est requise"
        )
    }),
  detenteurCompanyAddress: yup
    .string()
    .ensure()
    .when("detenteurIsPrivateIndividual", {
      is: true,
      then: schema =>
        schema.required(
          "L'adresse du détenteur de l'équipement (particulier) est requise"
        ),
      otherwise: schema =>
        schema.required(
          "L'adresse de l'entreprise détentrice de l'équipement est requise"
        )
    }),
  detenteurCompanyContact: yup
    .string()
    .ensure()
    .when("detenteurIsPrivateIndividual", {
      is: true,
      then: schema => schema.nullable().notRequired(),
      otherwise: schema =>
        schema
          .ensure()
          .required(
            "Le nom du contact de l'entreprise détentrice de l'équipement est requis"
          )
    }),
  detenteurCompanyPhone: yup
    .string()
    .ensure()
    .when("detenteurIsPrivateIndividual", {
      is: true,
      then: schema => schema.nullable().notRequired(),
      otherwise: schema =>
        schema.required(
          "Le numéro de téléphone de l'entreprise détentrice de l'équipement est requis"
        )
    }),
  detenteurCompanyMail: yup
    .string()
    .email()
    .ensure()
    .when("detenteurIsPrivateIndividual", {
      is: true,
      then: schema => schema.nullable().notRequired(),
      otherwise: schema =>
        schema.required(
          "L'adresse email de l'entreprise détentrice de l'équipement est requis"
        )
    }),
  operateurCompanyName: yup
    .string()
    .required("Le nom de l'entreprise de l'opérateur est requis"),
  operateurCompanySiret: siret.required(
    "Le SIRET de l'entreprise de l'opérateur est requis"
  ),
  operateurCompanyAddress: yup
    .string()
    .required("L'adresse de l'entreprise de l'opérateur est requis"),
  operateurCompanyContact: yup
    .string()
    .required("Le nom du contact de l'entreprise de l'opérateur est requis"),
  operateurCompanyPhone: yup
    .string()
    .required(
      "Le numéro de téléphone de l'entreprise de l'opérateur est requis"
    ),
  operateurCompanyMail: yup
    .string()
    .required("L'adresse email de l'entreprise de l'opérateur est requis")
});

export function validateFicheIntervention(
  ficheIntervention:
    | Prisma.BsffFicheInterventionCreateInput
    | Prisma.BsffFicheInterventionUpdateInput
) {
  return ficheInterventionSchema.validate(ficheIntervention, {
    abortEarly: false
  });
}
