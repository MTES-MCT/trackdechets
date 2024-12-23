import {
  BSDD_WASTE_CODES_ENUM,
  isSiret,
  PROCESSING_OPERATIONS_CODES_ENUM,
  WASTE_CODES_BALE
} from "@td/constants";
import { z } from "zod";

export const reasonSchema = z
  .enum(["MODIFIER", "EDIT", "ANNULER", "CANCEL", "IGNORER"], {
    invalid_type_error:
      "Le motif n'est pas une valeur autorisée. Valeurs possibles: MODIFIER, ANNULER"
  })
  .transform(val => {
    if (val === "EDIT") {
      return "MODIFIER";
    }
    if (val === "CANCEL") {
      return "ANNULER";
    }

    return val;
  })
  .optional();

export const publicIdSchema = z
  .string({
    required_error: "Le numéro unique est requis",
    invalid_type_error: "Le numéro unique doit être une chaîne de caractères"
  })
  .min(1, "Le numéro unique doit faire au moins 2 caractères")
  .max(36, "Le numéro unique ne peut pas dépasser 36 caractères")
  .refine(val => /^[a-zA-Z0-9-_./]+$/.test(val), {
    message:
      "Le numéro unique ne peut contenir que des lettres, des chiffres, des tirets, des underscores et des points"
  });

export const reportAsSiretSchema = z
  .union([
    z.string().optional(),
    z
      .number()
      .optional()
      .transform(val => (val ? String(val) : undefined))
  ])
  .pipe(
    z
      .string({
        invalid_type_error:
          "Le SIRET du déclarant doit être une chaîne de caractères"
      })
      .refine(value => {
        return isSiret(value);
      }, "Le SIRET du déclarant n'est pas un SIRET valide")
      .optional()
  );

export const wasteCodeSchema = z.nativeEnum(BSDD_WASTE_CODES_ENUM, {
  required_error: "Le code déchet est requis",
  invalid_type_error:
    "Le code déchet n'a pas une valeur autorisée. Il doit faire partie de la liste officielle des codes déchets. Ex: 17 02 01, 10 01 18*. Attention à bien respecter les espaces."
});

export const wasteDescriptionSchema = z
  .string()
  .min(2, "La dénomination usuelle du déchet doit faire au moins 2 caractères")
  .max(
    200,
    "La dénomination usuelle du déchet ne peut pas dépasser 200 caractères"
  );

export const wasteCodeBaleSchema = z.enum(WASTE_CODES_BALE).optional();

export const operationCodeSchema = z
  .string()
  .transform(val => val.replace(/([A-Z])(\d)/, "$1 $2")) // D5 becomes D 5
  .pipe(
    z.nativeEnum(
      { ...PROCESSING_OPERATIONS_CODES_ENUM, "R 0": "R 0" },
      {
        required_error: "Le code de traitement est requis",
        invalid_type_error:
          "Le code de traitement n'est pas une valeur autorisée. Valeurs possibles: R 0 à R 13, D 1 à D 15"
      }
    )
  );

export const weightValueSchema = z.coerce
  .number({
    required_error: "Le poids est requis",
    invalid_type_error: "Le poids doit être un nombre"
  })
  .min(0, "Le poids ne peut pas être inférieur à 0 tonnes")
  .max(1_000, "Le poids ne peut pas dépasser 1 000 tonnes")
  .multipleOf(0.001, "Le poids ne doit pas avoir plus de 3 décimales");

export const weightIsEstimateSchema = z.union(
  [
    z
      .enum(["ESTIME", "REEL"], {
        required_error: "Le type de poids est requis",
        invalid_type_error:
          "Le type de poids n'est pas valide. Valeurs possibles (sans accent): ESTIME, REEL"
      })
      .transform(val => val === "ESTIME"),
    z.boolean()
  ],
  { invalid_type_error: "Le type de poids saisi n'est pas valide" }
);

export const volumeSchema = z
  .union([
    z.number().optional(),
    z
      .string()
      .optional()
      .transform(val => (val ? Number(val) : undefined))
  ]) // No coercion to keep .optional()
  .pipe(
    z
      .number({
        required_error: "Le volume est requis",
        invalid_type_error: "Le volume doit être un nombre"
      })
      .min(0, "Le volume ne peut pas être inférieur à 0")
      .max(1_000, "Le volume ne peut pas dépasser 1 000 M3")
      .multipleOf(0.001, "Le volume ne doit pas avoir plus de 3 décimales")
      .optional()
  );

export const getActorTypeSchema = (name: string) =>
  z.enum(
    [
      "ENTREPRISE_FR",
      "ENTREPRISE_UE",
      "ENTREPRISE_HORS_UE",
      "ASSOCIATION",
      "PERSONNE_PHYSIQUE",
      "COMMUNE"
    ],
    {
      required_error: `Le type ${name} est requis`,
      invalid_type_error: `Le type ${name} n'est pas une valeur autorisée. Valeurs possibles: ENTREPRISE_FR, ENTREPRISE_UE, ENTREPRISE_HORS_UE, ASSOCIATION`
    }
  );

export const getActorOrgIdSchema = (name: string) =>
  z.coerce
    .string()
    .min(1, `Le numéro d'identification ${name} doit faire plus d'1 caractère`)
    .max(
      27,
      `Le numéro d'identification ${name} ne peut pas dépasser 27 caractères`
    );

export const getActorSiretSchema = (name: string) =>
  z
    .string({
      invalid_type_error: `Le SIRET ${name} doit être une chaîne de caractères`
    })
    .min(14, `Le SIRET ${name} ne doit pas faire moins de 14 chiffres`)
    .max(14, `Le SIRET ${name} ne doit pas faire plus de 14 chiffres`)
    .refine(value => {
      return isSiret(value);
    }, "Le SIRET du déclarant n'est pas un SIRET valide")
    .optional();

export const getActorNameSchema = (name: string) =>
  z
    .string()
    .min(2, `Le nom ${name} ne peut pas faire moins de 2 caractères`)
    .max(150, `Le nom ${name} ne peut pas dépasser 150 caractères`);

export const getActorAddressSchema = (name: string) =>
  z
    .string()
    .min(
      2,
      `Le libellé de la commune ${name} ne peut pas faire moins de 2 caractères`
    )
    .max(
      150,
      `Le libellé de la commune ${name} ne peut pas dépasser 150 caractères`
    );

export const getActorCitySchema = (name: string) =>
  z
    .string()
    .min(
      2,
      `Le libellé de la commune ${name} ne peut pas faire moins de 2 caractères`
    )
    .max(
      45,
      `Le libellé de la commune ${name} ne peut pas dépasser 45 caractères`
    );

export const getActorPostalCodeSchema = (name: string) =>
  z.coerce.string().refine(val => {
    if (!val) return true;
    return /^[0-9]{5,6}$/.test(val);
  }, `Le code postal ${name} n'est pas valide. Il doit être composé de 5 ou 6 chiffres`);

export const getActorCountryCodeSchema = (name: string) =>
  z.string().refine(val => {
    if (!val) return true;
    return /^[A-Z]{2}$/.test(val);
  }, `Le code du pays ${name} n'est pas valide. Il doit être composé de 2 lettres majuscules`);

export const transportModeSchema = z
  .enum(["ROUTE", "AÉRIEN", "FLUVIAL", "MARITIME", "PIPELINE", "FERRÉ"], {
    required_error: "Le mode de transport est requis",
    invalid_type_error:
      "Le mode de transport n'est pas valide. Consultez la documentation pour la liste des valeurs possibles"
  })
  .transform(val => {
    switch (val) {
      case "ROUTE":
        return "ROAD";
      case "AÉRIEN":
        return "AIR";
      case "FLUVIAL":
        return "RIVER";
      case "MARITIME":
        return "SEA";
      case "PIPELINE":
        return "OTHER";
      case "FERRÉ":
        return "RAIL";
      default:
        throw Error("Unhandled transport mode");
    }
  });

export const transportReceiptNumberSchema = z
  .string()
  .min(
    5,
    "Le numéro de récépissé de transport doit faire au moins 5 caractères"
  )
  .max(
    50,
    "Le numéro de récépissé de transport ne peut pas dépasser 50 caractères"
  );
