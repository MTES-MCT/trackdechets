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
    .min(14, "Le SIRET de l'émetteur ne doit pas faire moins de 14 chiffres")
    .max(14, "Le SIRET de l'émetteur ne doit pas faire plus de 14 chiffres")
    .refine(value => {
      return isSiret(value);
    }, "Le SIRET de l'émetteur n'est pas un SIRET valide"),
  useDate: z.coerce
    .date()
    .min(
      sub(new Date(), { years: 1 }),
      "La date d'utilisation ne peut pas être antérieure à J-1an"
    )
    .max(new Date(), "La date d'utilisation ne peut pas être dans le futur")
    .optional(),
  dispatchDate: z.coerce
    .date()
    .min(
      sub(new Date(), { years: 1 }),
      "La date d'utilisation ne peut pas être antérieure à J-1an"
    )
    .max(new Date(), "La date d'utilisation ne peut pas être dans le futur")
    .optional(),
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
              "Les dénominations usuelles du déchet doivent faire au moins 2 charactères"
            )
            .max(
              150,
              "Les dénominations usuelles du déchet ne peuvent pas dépasser 150 charactères"
            )
        )
        .optional()
    ),
  product: z
    .string()
    .min(2, "Le produit doit faire au moins 2 charactères")
    .max(75, "Le produit ne peut pas dépasser 75 charactères"),
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
  processingEndDate: z.coerce
    .date()
    .min(
      sub(new Date(), { years: 1 }),
      "La date de fin de traitement ne peut pas être antérieure à J-1an"
    )
    .max(
      new Date(),
      "La date de fin de traitement ne peut pas être dans le futur"
    )
    .optional(),
  destinationType: getActorTypeSchema("de destinataire"),
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
  administrativeActReference: z
    .string()
    .min(
      8,
      "La référence d'acte administratif doit faire au moins 8 charactères"
    )
    .max(
      100,
      "La référence d'acte administratif ne peut pas dépasser 100 charactères"
    )
    .refine(
      val => /^[a-zA-ZÀ-û0-9\s]+$/.test(val),
      "La référence d'acte administratif ne peut contenir que des lettres ou des chiffres"
    )
});

// Props added through transform
const transformedSsdSchema = z.object({
  reportForAddress: z.string().default(""),
  reportForCity: z.string().default(""),
  reportForPostalCode: z.string().default(""),
  reportForName: z.coerce.string().default("")
});

export const ssdSchema = inputSsdSchema.merge(transformedSsdSchema);
