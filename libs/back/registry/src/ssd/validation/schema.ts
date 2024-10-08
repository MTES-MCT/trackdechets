import { OperationMode } from "@prisma/client";
import {
  BSDA_WASTE_CODES,
  isSiret,
  PROCESSING_OPERATIONS_CODES_ENUM,
  WASTE_CODES_BALE
} from "@td/constants";
import { sub } from "date-fns";
import { z } from "zod";

export type ParsedZodSsdItem = z.output<typeof ssdSchema>;

const inputSsdSchema = z.object({
  reason: z
    .enum(["MODIFIER", "ANNULER", "IGNORER"], {
      invalid_type_error:
        "Le motif n'est pas une valeur autorisée. Valeurs possibles: MODIFIER, ANNULER"
    })
    .optional(),
  publicId: z
    .string({
      required_error: "Le numéro unique est requis",
      invalid_type_error: "Le numéro unique doit être une chaîne de caractères"
    })
    .min(1, "Le numéro unique doit faire au moins 2 charactères")
    .max(30, "Le numéro unique ne peut pas dépasser 30 charactères")
    .refine(val => /^[a-zA-Z0-9-_./]+$/.test(val), {
      message:
        "Le numéro unique ne peut contenir que des lettres, des chiffres, des tirets, des underscores et des points"
    }),
  reportAsSiret: z.coerce
    .string({
      invalid_type_error:
        "Le SIRET du déclarant doit être une chaîne de caractères"
    })
    .min(14, "Le SIRET du déclarant ne doit pas faire moins de 14 chiffres")
    .max(14, "Le SIRET du déclarant ne doit pas faire plus de 14 chiffres")
    .refine(value => {
      return isSiret(value);
    }, "Le SIRET du déclarant n'est pas un SIRET valide")
    .optional(),
  reportForName: z
    .string()
    .min(2, "Le nom du déclarant ne peut pas faire moins de 2 charactères")
    .max(150, "Le nom du déclarant ne peut pas dépasser 150 charactères"),
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
  wasteCode: z.enum(BSDA_WASTE_CODES), // TODO quels codes ?
  wasteDescription: z
    .string()
    .min(
      2,
      "La dénomination usuelle du déchet doit faire au moins 2 charactères"
    )
    .max(
      150,
      "La dénomination usuelle du déchet ne peut pas dépasser 150 charactères"
    ),
  wasteCodeBale: z.enum(WASTE_CODES_BALE).optional(),
  secondaryWasteCodes: z.preprocess(
    val =>
      val
        ? String(val)
            .split(",")
            .map(val => val.trim())
        : [],
    z.array(z.enum(BSDA_WASTE_CODES)).optional()
  ),
  secondaryWasteDescriptions: z.preprocess(
    val =>
      val
        ? String(val)
            .split(",")
            .map(val => val.trim())
        : [],
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
  quantity: z.coerce
    .number({
      required_error: "La quantité est requise",
      invalid_type_error: "La quantité doit être un nombre"
    })
    .min(0, "La quantité ne peut pas être inférieure à 0")
    .max(100_000_000, "La quantité ne peut pas dépasser 100 000 000")
    .multipleOf(0.001, "La quantité ne doit pas avoir plus de 3 décimales"),
  unit: z.enum(["T", "M3"], {
    required_error: "L'unité est requise",
    invalid_type_error: "L'unité n'est pas valide. Valeurs possibles: T, M3"
  }),
  processingDate: z.coerce
    .date()
    .min(
      sub(new Date(), { years: 1 }),
      "La date de traitement ne peut pas être antérieure à J-1an"
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
  destinationType: z.enum(
    ["ENTREPRISE_FR", "ENTREPRISE_UE", "ENTREPRISE_HORS_UE", "ASSOCIATION"],
    {
      required_error: "Le type de destinataire est requis",
      invalid_type_error:
        "Le type de destinataire n'est pas une valeur autorisée. Valeurs possibles: ENTREPRISE_FR, ENTREPRISE_UE, ENTREPRISE_HORS_UE, ASSOCIATION"
    }
  ),
  destinationOrgId: z
    .string()
    .min(
      1,
      "Le numéro d'identification du destinataire doit faire plus d'1 charactère"
    )
    .max(
      27,
      "Le numéro d'identification du destinataire ne peut pas dépasser 27 charactères"
    ),
  destinationName: z
    .string()
    .min(2, "Le nom du destinataire ne peut pas faire moins de 2 charactères")
    .max(150, "Le nom du destinataire ne peut pas dépasser 150 charactères"),
  destinationAddress: z
    .string()
    .min(
      2,
      "Le libellé de la commune du destinataire ne peut pas faire moins de 2 charactères"
    )
    .max(
      150,
      "Le libellé de la commune du destinataire ne peut pas dépasser 150 charactères"
    ),
  destinationCity: z
    .string()
    .min(
      2,
      "Le libellé de la commune du destinataire ne peut pas faire moins de 2 charactères"
    )
    .max(
      45,
      "Le libellé de la commune du destinataire ne peut pas dépasser 45 charactères"
    ),
  destinationPostalCode: z.string().refine(val => {
    if (!val) return true;
    return /^[0-9]{5,6}$/.test(val);
  }, "Le code postal du destinataire n'est pas valide. Il doit être composé de 5 ou 6 chiffres."),
  destinationCountryCode: z.string().refine(val => {
    if (!val) return true;
    return /^[A-Z]{2}$/.test(val);
  }, "Le code du pays du destinataire n'est pas valide. Il doit être composé de 2 lettres majuscules."),
  operationCode: z.nativeEnum(PROCESSING_OPERATIONS_CODES_ENUM, {
    required_error: "Le code de traitement est requis",
    invalid_type_error:
      "Le code de traitement n'est pas une valeur autorisée. Valeurs possibles: R1 à R13, D1 à D15"
  }),
  operationMode: z
    .enum(
      ["Réutilisation", "Recyclage", "Valorisation énergétique", "Élimination"],
      {
        required_error: "Le code de qualification est requis",
        invalid_type_error:
          "Le code de qualification n'est pas une valeur autorisée. Valeurs possibles: Réutilisation, Recyclage, Valorisation énergétique ou Élimination"
      }
    )
    .transform(val => {
      switch (val) {
        case "Réutilisation":
          return OperationMode.REUTILISATION;
        case "Recyclage":
          return OperationMode.RECYCLAGE;
        case "Valorisation énergétique":
          return OperationMode.VALORISATION_ENERGETIQUE;
        case "Élimination":
          return OperationMode.ELIMINATION;
        default:
          throw Error("Unhandled qualification code");
      }
    }),
  administrativeActReference: z
    .string()
    .min(
      10,
      "La référence d'acte administratif doit faire au moins 10 charactères"
    )
    .max(
      100,
      "La référence d'acte administratif ne peut pas dépasser 100 charactères"
    )
    .refine(
      val => /^[a-zA-ZÀ-ú0-9\s]+$/.test(val),
      "La référence d'acte administratif ne peut contenir que des lettres ou des chiffres"
    )
});

// Props added through transform
const transformedSsdSchema = z.object({
  reportForAddress: z.string(),
  reportForCity: z.string(),
  reportForPostalCode: z.string(),
  reportForSiret: z.coerce.string()
});

export const ssdSchema = inputSsdSchema.merge(transformedSsdSchema);
