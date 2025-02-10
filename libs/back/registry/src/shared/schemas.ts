import { OperationMode } from "@prisma/client";
import {
  ALL_TD_PROCESSING_OPERATIONS_CODES,
  BSDD_WASTE_CODES_ENUM,
  isSiret,
  TdOperationCodeEnum,
  WASTE_CODES_BALE,
  WasteCodeEnum
} from "@td/constants";
import { sub } from "date-fns";
import { z } from "zod";

export const reasonSchema = z
  .string()
  .transform(val =>
    val
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
  )
  .pipe(
    z
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
  )
  .nullish();

export const publicIdSchema = z.coerce
  .string({
    required_error: "L'identifiant unique est requis",
    invalid_type_error:
      "L'identifiant unique doit être une chaîne de caractères"
  })
  .min(1, "L'identifiant unique doit faire au moins 1 caractères")
  .max(36, "L'identifiant unique ne peut pas dépasser 36 caractères")
  .refine(val => /^[a-zA-Z0-9-_./]+$/.test(val), {
    message:
      "L'identifiant unique ne peut contenir que des lettres, des chiffres, des tirets, des underscores et des points"
  });

export const siretSchema = z.coerce
  .string({
    invalid_type_error: `Le SIRET doit être une chaîne de caractères`
  })
  .refine(value => {
    return isSiret(value);
  }, `Le SIRET n'est pas valide`);

export const reportAsCompanySiretSchema = z
  .union([
    z.string().nullish(),
    z
      .number()
      .nullish()
      .transform(val => (val ? String(val) : undefined))
  ])
  .pipe(siretSchema.nullish());

export const getWasteCodeSchema = (
  wasteCodes: WasteCodeEnum = BSDD_WASTE_CODES_ENUM
) =>
  z.coerce
    .string()
    .nullish() // So that coercion is a no-op for null & undefined. This enables the use of .nullish() on getWasteCodeSchema
    .pipe(
      z.enum(wasteCodes, {
        required_error: "Le code déchet est requis",
        invalid_type_error:
          "Le code déchet n'a pas une valeur autorisée. Il doit faire partie de la liste officielle des codes déchets. Ex: 17 02 01, 10 01 18*. Attention à bien respecter les espaces."
      })
    );

export const booleanSchema = z.union(
  [
    z
      .string()
      .transform(val => val.toUpperCase())
      .pipe(
        z
          .enum(["OUI", "NON"], {
            required_error: "Le champ est requis",
            invalid_type_error:
              "Le champ n'est pas valide. Valeurs possibles: OUI, NON"
          })
          .transform(val => val === "OUI")
      ),
    z.boolean()
  ],
  { invalid_type_error: "La valeur saisie n'est pas valide" }
);

export const wasteDescriptionSchema = z
  .string()
  .min(2, "La dénomination usuelle du déchet doit faire au moins 2 caractères")
  .max(
    300,
    "La dénomination usuelle du déchet ne peut pas dépasser 300 caractères"
  );

export const wasteCodeBaleSchema = z.enum(WASTE_CODES_BALE).nullish();

export const getOperationCodeSchema = (
  operationCodes: TdOperationCodeEnum = ALL_TD_PROCESSING_OPERATIONS_CODES
) =>
  z
    .string()
    .trim()
    .transform(val => val.replace(/([A-Z])(\d)/, "$1 $2")) // D5 becomes D 5
    .pipe(
      z.enum(operationCodes, {
        required_error: "Le code de traitement est requis",
        invalid_type_error:
          "Le code de traitement n'est pas une valeur autorisée. Valeurs possibles: R 0 à R 13, D 1 à D 15"
      })
    );

export const operationModeSchema = z
  .string()
  .trim()
  .transform(val =>
    val
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/ /g, "_")
  )
  .pipe(
    z
      .enum(
        [
          "REUTILISATION",
          "RECYCLAGE",
          "VALORISATION_ENERGETIQUE",
          "ELIMINATION"
        ],
        {
          required_error: "Le code de qualification est requis",
          invalid_type_error:
            "Le code de qualification n'est pas une valeur autorisée. Valeurs possibles: Réutilisation, Recyclage, Valorisation énergétique ou Élimination"
        }
      )
      .transform(val => {
        switch (val) {
          case "REUTILISATION":
            return OperationMode.REUTILISATION;
          case "RECYCLAGE":
            return OperationMode.RECYCLAGE;
          case "VALORISATION_ENERGETIQUE":
            return OperationMode.VALORISATION_ENERGETIQUE;
          case "ELIMINATION":
            return OperationMode.ELIMINATION;
          default:
            throw Error(`Unhandled qualification code: ${val}`);
        }
      })
  )
  .nullish();

export const weightValueSchema = z
  .union([
    z.number().nullish(),
    z
      .string()
      .trim()
      .nullish()
      .transform(val => (val ? Number(val.replace(",", ".")) : undefined))
  ]) // No coercion to keep .nullish()
  .pipe(
    z
      .number({
        required_error: "Le poids est requis",
        invalid_type_error: "Le poids doit être un nombre"
      })
      .gt(0, "Le poids ne peut pas être inférieur ou égal à 0 tonnes")
      .lte(1_000, "Le poids ne peut pas dépasser 1 000 tonnes")
      .multipleOf(0.001, "Le poids ne doit pas avoir plus de 3 décimales")
  );

export const weightIsEstimateSchema = z.union(
  [
    z
      .string()
      .trim()
      .transform(val =>
        val
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
      )
      .pipe(
        z
          .enum(["ESTIME", "REEL"], {
            required_error: "Le type de poids est requis",
            invalid_type_error:
              "Le type de poids n'est pas valide. Valeurs possibles (sans accent): ESTIME, REEL"
          })
          .transform(val => val === "ESTIME")
      ),
    z.boolean()
  ],
  { invalid_type_error: "Le type de poids saisi n'est pas valide" }
);

export const volumeSchema = z
  .union([
    z.number().nullish(),
    z
      .string()
      .trim()
      .nullish()
      .transform(val => (val ? Number(val.replace(",", ".")) : undefined))
  ]) // No coercion to keep .nullish()
  .pipe(
    z
      .number({
        required_error: "Le volume est requis",
        invalid_type_error: "Le volume doit être un nombre"
      })
      .gt(0, "Le volume ne peut pas être inférieur ou égal à 0")
      .lte(1_000, "Le volume ne peut pas dépasser 1 000 M3")
      .multipleOf(0.001, "Le volume ne doit pas avoir plus de 3 décimales")
      .nullish()
  );

export const dateSchema = z.coerce
  .date()
  .min(
    sub(new Date(), { years: 1 }),
    "La date ne peut pas être antérieure à J-1 an"
  )
  .refine(date => date <= new Date(), "La date ne peut pas être dans le futur"); // Dont use max() as the date must be dynamic

export const nullishDateSchema = z
  .union([
    z.date().nullish(),
    z
      .string()
      .trim()
      .nullish()
      .transform((val, ctx) => {
        if (val) {
          const timestamp = Date.parse(val);
          if (isNaN(timestamp)) {
            ctx.addIssue({
              code: "invalid_date",
              message:
                "Le format de date est invalide. Exemple de format possible: 2000-01-22"
            });
            return z.NEVER;
          }
          return new Date(timestamp);
        }

        return undefined;
      })
  ])
  .pipe(
    z
      .date()
      .min(
        sub(new Date(), { years: 1 }),
        "La date ne peut pas être antérieure à J-1 an"
      )
      .refine(
        date => date <= new Date(),
        "La date ne peut pas être dans le futur"
      )
      .nullish()
  );

export const inseeCodesSchema = z
  .string()
  .trim()
  .nullish()
  .transform(val =>
    val
      ? String(val)
          .split(",")
          .map(val => val.trim())
      : []
  )
  .pipe(
    z.array(
      z
        .string()
        .trim()
        .refine(
          val => val.length === 5,
          "Le code INSEE d'une commune doit faire 5 caractères"
        )
    )
  );

export const municipalitiesNamesSchema = z
  .string()
  .trim()
  .nullish()
  .transform(val =>
    val
      ? String(val)
          .split(",")
          .map(val => val.trim())
      : []
  )
  .pipe(
    z.array(
      z
        .string()
        .trim()
        .min(
          1,
          "Le libellé de la commune de collecte de déchet doit faire plus de 1 caractère"
        )
        .max(
          300,
          "Le libellé de la commune de collecte de déchet doit faire moins de 300 caractères"
        )
    )
  );

export const declarationNumberSchema = z
  .string()
  .transform(v => v.replace(/\s+/g, ""))
  .refine(
    v => /^A7[EI][0-9]{10}$/.test(v),
    "Le numéro de déclaration GISTRID ne respecte pas le format attendu"
  )

  .nullish();

export const notificationNumberSchema = z
  .string()
  .transform(v => v.replace(/\s+/g, ""))
  .refine(
    v => /^[A-Z]{2}[0-9]{10}$/.test(v),
    "Le numéro de notification GISTRID ne respecte pas le format attendu"
  )
  .nullish();

const parcelNumbersArraySchema = z.array(
  z
    .string()
    .transform(v => v.replace(/\s+/g, ""))
    .refine(
      v => /^\d{1,3}-[A-Z]{2}-\d{1,4}$/.test(v),
      "Le numéro de parcelle ne respecte pas le format attendu"
    )
);

export const parcelNumbersSchema = z.union([
  z
    .string()
    .trim()
    .nullish()
    .transform(val =>
      val
        ? String(val)
            .split(",")
            .map(val => val.trim())
        : []
    )
    .pipe(parcelNumbersArraySchema),
  parcelNumbersArraySchema
]);

const parcelCoordinatesArraySchema = z.array(
  z
    .string()
    .trim()
    .regex(
      /^-?\d+(\.\d+)? -?\d+(\.\d+)?$/,
      "La coordonnée ne respecte pas le format attendu"
    )
);

export const parcelCoordinatesSchema = z.union([
  z
    .string()
    .trim()
    .nullish()
    .transform(val =>
      val
        ? String(val)
            .split(",")
            .map(val => val.trim())
        : []
    )
    .pipe(parcelCoordinatesArraySchema),
  parcelCoordinatesArraySchema
]);

export const actorTypeSchema = z.enum(
  [
    "ETABLISSEMENT_FR",
    "ENTREPRISE_UE",
    "ENTREPRISE_HORS_UE",
    "ASSOCIATION",
    "PERSONNE_PHYSIQUE",
    "COMMUNES"
  ],
  {
    required_error: `Le type est requis`,
    invalid_type_error: `Le type n'est pas une valeur autorisée. Valeurs possibles: ETABLISSEMENT_FR, ENTREPRISE_UE, ENTREPRISE_HORS_UE, ASSOCIATION`
  }
);

export const actorOrgIdSchema = z.coerce
  .string()
  .trim()
  .min(1, `Le numéro d'identification doit faire plus de 1 caractère`)
  .max(27, `Le numéro d'identification ne peut pas dépasser 27 caractères`);

export const actorSiretSchema = siretSchema.nullish();

export const actorNameSchema = z
  .string()
  .trim()
  .min(1, `La raison sociale ne peut pas faire moins de 1 caractère`)
  .max(150, `La raison sociale ne peut pas dépasser 150 caractères`);

export const actorAddressSchema = z
  .string()
  .trim()
  .min(1, `Le libellé de l'adresse ne peut pas faire moins de 1 caractère`)
  .max(150, `Le libellé de l'adresse ne peut pas dépasser 150 caractères`);

export const actorCitySchema = z
  .string()
  .trim()
  .min(1, `La commune ne peut pas faire moins de 1 caractère`)
  .max(45, `La commune ne peut pas dépasser 45 caractères`);

export const actorPostalCodeSchema = z.coerce
  .string()
  .trim()
  .refine(val => {
    if (!val) return true;
    return /^[A-Za-z0-9][A-Za-z0-9\- ]{2,9}[A-Za-z0-9]$/.test(val);
  }, `Le code postal n'est pas dans un format valide`);

export const actorCountryCodeSchema = z
  .string()
  .trim()
  .refine(val => {
    if (!val) return true;
    return /^[A-Z]{2}$/.test(val);
  }, `Le code du pays n'est pas valide. Il doit être composé de 2 lettres majuscules`);

export const transportModeSchema = z
  .enum(
    [
      "ROUTE",
      "AÉRIEN",
      "FLUVIAL",
      "MARITIME",
      "PIPELINE",
      "FERRÉ",
      "ROAD",
      "AIR",
      "RIVER",
      "SEA",
      "OTHER",
      "RAIL"
    ],
    {
      required_error: "Le mode de transport est requis",
      invalid_type_error:
        "Le mode de transport n'est pas valide. Consultez la documentation pour la liste des valeurs possibles"
    }
  )
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
        return val;
    }
  });

export const transportRecepisseNumberSchema = z.coerce
  .string()
  .trim()
  .min(
    5,
    "Le numéro de récépissé de transport doit faire au moins 5 caractères"
  )
  .max(
    50,
    "Le numéro de récépissé de transport ne peut pas dépasser 50 caractères"
  );
