import { BSDD_WASTE_CODES_ENUM } from "@td/constants";
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
  getReportForSiretSchema,
  getOperationCodeSchema,
  publicIdSchema,
  reasonSchema,
  reportAsCompanySiretSchema,
  volumeSchema,
  wasteCodeBaleSchema,
  getWasteCodeSchema,
  wasteDescriptionSchema,
  weightIsEstimateSchema,
  weightValueSchema,
  operationModeSchema
} from "../../shared/schemas";

export type ParsedZodInputSsdItem = z.output<typeof inputSsdSchema>;
export type ParsedZodSsdItem = z.output<typeof ssdSchema>;

const inputSsdSchema = z.object({
  reason: reasonSchema,
  publicId: publicIdSchema,
  reportAsCompanySiret: reportAsCompanySiretSchema,
  reportForCompanySiret: getReportForSiretSchema("de l'émetteur"),
  useDate: z.union([
    z.date().nullish(),
    z
      .string()
      .nullish()
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
          .nullish()
      )
  ]),
  dispatchDate: z.union([
    z.date().nullish(),
    z
      .string()
      .nullish()
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
          .nullish()
      )
  ]),
  wasteCode: getWasteCodeSchema(),
  wasteDescription: wasteDescriptionSchema,
  wasteCodeBale: wasteCodeBaleSchema,
  secondaryWasteCodes: z
    .string()
    .nullish()
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
          z.enum(BSDD_WASTE_CODES_ENUM, {
            required_error: "Le code déchet secondaire est requis",
            invalid_type_error:
              "Le code déchet secondaire n'a pas une valeur autorisée. Il doit faire partie de la liste officielle des codes déchets. Ex: 17 02 01, 10 01 18*. Attention à bien respecter les espaces"
          })
        )
        .optional()
    ),
  secondaryWasteDescriptions: z
    .string()
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
          .min(
            2,
            "Les dénominations usuelles du déchet doivent faire au moins 2 caractères"
          )
          .max(
            200,
            "Les dénominations usuelles du déchet ne peuvent pas dépasser 200 caractères"
          )
      )
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
    z.date().nullish(),
    z
      .string()
      .nullish()
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
          .nullish()
      )
  ]),
  destinationCompanyType: getActorTypeSchema("de destinataire").exclude([
    "PERSONNE_PHYSIQUE",
    "COMMUNE"
  ]),
  destinationCompanyOrgId: getActorOrgIdSchema("du destinataire"),
  destinationCompanyName: getActorNameSchema("du destinataire"),
  destinationCompanyAddress: getActorAddressSchema("du destinataire"),
  destinationCompanyCity: getActorCitySchema("du destinataire"),
  destinationCompanyPostalCode: getActorPostalCodeSchema("du destinataire"),
  destinationCompanyCountryCode: getActorCountryCodeSchema("du destinataire"),
  operationCode: getOperationCodeSchema(),
  operationMode: operationModeSchema,
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
  reportForCompanyAddress: z.string().default(""),
  reportForCompanyCity: z.string().default(""),
  reportForCompanyPostalCode: z.string().default(""),
  reportForCompanyName: z.coerce.string().default(""),
  id: z.string().optional()
});

export const ssdSchema = inputSsdSchema.merge(transformedSsdSchema);
