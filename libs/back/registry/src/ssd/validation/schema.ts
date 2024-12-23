import { OperationMode } from "@prisma/client";
import { BSDD_WASTE_CODES_ENUM, isSiret } from "@td/constants";
import { sub } from "date-fns";
import { z } from "zod";
import {
  getActorAddressSchema,
  getActorCitySchema,
  getActorCountryCodeSchema,
  getActorNameSchema,
  getActorOrgIdSchema,
  getActorPostalCodeSchema,
  getActorTypeSchema,
  operationCodeSchema,
  publicIdSchema,
  reasonSchema,
  reportAsSiretSchema,
  volumeSchema,
  wasteCodeBaleSchema,
  wasteCodeSchema,
  wasteDescriptionSchema,
  weightIsEstimateSchema,
  weightValueSchema
} from "../../shared/schemas";

export type ParsedZodSsdItem = z.output<typeof ssdSchema>;

const inputSsdSchema = z.object({
  reason: reasonSchema,
  publicId: publicIdSchema,
  reportAsSiret: reportAsSiretSchema,
  reportForSiret: z.coerce
    .string({
      invalid_type_error:
        "Le SIRET de l'émetteur doit être une chaîne de caractères"
    })
    .refine(value => {
      return isSiret(value);
    }, "Le SIRET de l'émetteur n'est pas un SIRET valide"),
  useDate: z.union([
    z.date().optional(),
    z
      .string()
      .optional()
      .transform(val => (val ? new Date(val) : undefined))
      .pipe(
        z
          .date()
          .min(
            sub(new Date(), { years: 1 }),
            "La date d'utilisation ne peut pas être antérieure à J-1an"
          )
          .max(
            new Date(),
            "La date d'utilisation ne peut pas être dans le futur"
          )
          .optional()
      )
  ]),
  dispatchDate: z.union([
    z.date().optional(),
    z
      .string()
      .optional()
      .transform(val => (val ? new Date(val) : undefined))
      .pipe(
        z
          .date()
          .min(
            sub(new Date(), { years: 1 }),
            "La date d'utilisation ne peut pas être antérieure à J-1an"
          )
          .max(
            new Date(),
            "La date d'utilisation ne peut pas être dans le futur"
          )
          .optional()
      )
  ]),
  wasteCode: wasteCodeSchema,
  wasteDescription: wasteDescriptionSchema,
  wasteCodeBale: wasteCodeBaleSchema,
  secondaryWasteCodes: z
    .string()
    .optional()
    .transform(val =>
      val
        ? String(val)
            .split(",")
            .map(val => val.trim())
        : []
    )
    .pipe(
      z
        .array(
          z.nativeEnum(BSDD_WASTE_CODES_ENUM, {
            required_error: "Le code déchet secondaire est requis",
            invalid_type_error:
              "Le code déchet secondaire n'a pas une valeur autorisée. Il doit faire partie de la liste officielle des codes déchets. Ex: 17 02 01, 10 01 18*. Attention à bien respecter les espaces"
          })
        )
        .optional()
    ),
  secondaryWasteDescriptions: z
    .string()
    .optional()
    .transform(val =>
      val
        ? String(val)
            .split(",")
            .map(val => val.trim())
        : []
    )
    .pipe(
      z
        .array(
          z
            .string()
            .min(
              2,
              "Les dénominations usuelles du déchet doivent faire au moins 2 caractères"
            )
            .max(
              200,
              "Les dénominations usuelles du déchet ne peuvent pas dépasser 200 caractères"
            )
        )
        .optional()
    ),
  product: z
    .string()
    .min(2, "Le produit doit faire au moins 2 caractères")
    .max(75, "Le produit ne peut pas dépasser 75 caractères"),
  weightValue: weightValueSchema,
  weightIsEstimate: weightIsEstimateSchema,
  volume: volumeSchema,
  processingDate: z.coerce
    .date()
    .min(
      sub(new Date(), { years: 1 }),
      "La date de traitement ne peut pas être antérieure à J-1 an"
    )
    .max(new Date(), "La date de traitement ne peut pas être dans le futur"),
  processingEndDate: z.union([
    z.date().optional(),
    z
      .string()
      .optional()
      .transform(val => (val ? new Date(val) : undefined))
      .pipe(
        z
          .date()
          .min(
            sub(new Date(), { years: 1 }),
            "La date de fin de traitement ne peut pas être antérieure à J-1an"
          )
          .max(
            new Date(),
            "La date de fin de traitement ne peut pas être dans le futur"
          )
          .optional()
      )
  ]),
  destinationType: getActorTypeSchema("de destinataire").exclude([
    "PERSONNE_PHYSIQUE",
    "COMMUNE"
  ]),
  destinationOrgId: getActorOrgIdSchema("du destinataire"),
  destinationName: getActorNameSchema("du destinataire"),
  destinationAddress: getActorAddressSchema("du destinataire"),
  destinationCity: getActorCitySchema("du destinataire"),
  destinationPostalCode: getActorPostalCodeSchema("du destinataire"),
  destinationCountryCode: getActorCountryCodeSchema("du destinataire"),
  operationCode: operationCodeSchema,
  operationMode: z
    .enum(
      [
        "Réutilisation",
        "Reutilisation",
        "REUTILISATION",
        "RECYCLAGE",
        "Recyclage",
        "Valorisation énergétique",
        "VALORISATION_ENERGETIQUE",
        "Élimination",
        "Elimination",
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
        case "Réutilisation":
        case "Reutilisation":
        case "REUTILISATION":
          return OperationMode.REUTILISATION;
        case "Recyclage":
        case "RECYCLAGE":
          return OperationMode.RECYCLAGE;
        case "Valorisation énergétique":
        case "VALORISATION_ENERGETIQUE":
          return OperationMode.VALORISATION_ENERGETIQUE;
        case "Élimination":
        case "Elimination":
        case "ELIMINATION":
          return OperationMode.ELIMINATION;
        default:
          throw Error("Unhandled qualification code");
      }
    }),
  administrativeActReference: z.enum([
    "Implicite",
    "Arrêté du 29 juillet 2014",
    "Arrêté du 24 août 2016",
    "Arrêté du 10 juillet 2017",
    "Arrêté du 11 décembre 2018",
    "Arrêté du 22 février 2019",
    "Arrêté du 25 février 2019",
    "Arrêté du 4 juin 2021",
    "Arrêté du 13 décembre 2021",
    "Arrêté du 21 décembre 2021",
    "Arrêté du 19 février 2024"
  ])
});

// Props added through transform
const transformedSsdSchema = z.object({
  reportForAddress: z.string().default(""),
  reportForCity: z.string().default(""),
  reportForPostalCode: z.string().default(""),
  reportForName: z.coerce.string().default(""),
  id: z.string().optional()
});

export const ssdSchema = inputSsdSchema.merge(transformedSsdSchema);
