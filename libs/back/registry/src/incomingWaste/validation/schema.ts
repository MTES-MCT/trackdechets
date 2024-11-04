import { isSiret } from "@td/constants";
import { z } from "zod";
import {
  reasonSchema,
  publicIdSchema,
  reportAsSiretSchema,
  wasteCodeSchema,
  wasteCodeBaleSchema,
  wasteDescriptionSchema,
  volumeSchema,
  weightIsEstimateSchema,
  weightValueSchema,
  getActorTypeSchema,
  getActorOrgIdSchema,
  getActorAddressSchema,
  getActorCitySchema,
  getActorCountryCodeSchema,
  getActorNameSchema,
  getActorPostalCodeSchema,
  transportModeSchema,
  transportReceiptNumberSchema,
  operationCodeSchema,
  getActorSiretSchema
} from "../../shared/schemas";
import { sub } from "date-fns";

const inputIncomingWasteSchema = z.object({
  reason: reasonSchema,
  publicId: publicIdSchema,
  reportAsSiret: reportAsSiretSchema,
  reportForSiret: z.coerce
    .string({
      invalid_type_error:
        "Le SIRET du destinataire doit être une chaîne de caractères"
    })
    .min(14, "Le SIRET du destinataire ne doit pas faire moins de 14 chiffres")
    .max(14, "Le SIRET du destinataire ne doit pas faire plus de 14 chiffres")
    .refine(value => {
      return isSiret(value);
    }, "Le SIRET du destinataire n'est pas un SIRET valide"),
  wasteCode: wasteCodeSchema,
  wastePop: z.union(
    [
      z
        .enum(["OUI", "NON"], {
          required_error: "Le champ POP est requis",
          invalid_type_error:
            "Le champ POP n'est pas valide. Valeurs possibles: OUI, NON"
        })
        .transform(val => val === "OUI"),
      z.boolean()
    ],
    { invalid_type_error: "Le champ POP saisi n'est pas valide" }
  ),
  wasteIsDangerous: z.union(
    [
      z
        .enum(["OUI", "NON"], {
          required_error: "Le champ Dangereux est requis",
          invalid_type_error:
            "Le champ Dangereux n'est pas valide. Valeurs possibles: OUI, NON"
        })
        .transform(val => val === "OUI")
        .optional(),
      z.boolean().optional()
    ],
    { invalid_type_error: "Le champ Dangereux saisi n'est pas valide" }
  ),
  wasteDescription: wasteDescriptionSchema,
  wasteCodeBale: wasteCodeBaleSchema,
  receptionDate: z.coerce
    .date()
    .min(
      sub(new Date(), { years: 1 }),
      "La date réception ne peut pas être antérieure à J-1an"
    )
    .max(new Date(), "La date réception ne peut pas être dans le futur"),
  weighingHour: z
    .string()
    .refine(val => {
      if (!val) {
        return true;
      }
      // 00:00 or 00:00:00 or 00:00:00.000
      return /^\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?$/.test(val);
    }, `L'heure de pesée n'est pas valide. Format attendu: 00:00, 00:00:00 ou 00:00:00.000`)
    .optional(),
  weightValue: weightValueSchema,
  weightIsEstimate: weightIsEstimateSchema,
  volume: volumeSchema,
  producerType: getActorTypeSchema("de producteur"),
  producerOrgId: getActorOrgIdSchema("du producteur"),
  producerName: getActorNameSchema("du producteur"),
  producerAddress: getActorAddressSchema("du producteur"),
  producerPostalCode: getActorCitySchema("du producteur"),
  producerCity: getActorPostalCodeSchema("du producteur"),
  producerCountryCode: getActorCountryCodeSchema("du producteur"),
  municipalitiesInseeCodes: z.string().optional(), // TODO regexp & contraintes
  municipalitiesNames: z
    .string()
    .min(
      1,
      "Le libellé de la commune de collecte de déchet doit faire plus de 1 caractère"
    )
    .max(
      300,
      "Le libellé de la commune de collecte de déchet doit faire moins de 300 caractères"
    )
    .optional(),
  senderType: getActorTypeSchema("d'expéditeur"),
  senderOrgId: getActorOrgIdSchema("d'expéditeur"),
  senderName: getActorNameSchema("d'expéditeur'"),
  senderTakeOverFullAddress: z
    .string()
    .min(
      1,
      "L'adresse de prise en charge de l'expéditeur doit faire plus de 1 caractère"
    )
    .max(
      150,
      "L'adresse de prise en charge de l'expéditeur doit faire moins de 150 caractères"
    )
    .optional(),
  senderAddress: getActorAddressSchema("d'expéditeur'"),
  senderPostalCode: getActorCitySchema("d'expéditeur'"),
  senderCity: getActorPostalCodeSchema("d'expéditeur'"),
  senderCountryCode: getActorCountryCodeSchema("d'expéditeur'"),
  brokerSiret: getActorSiretSchema("du courtier").optional(),
  brokerName: getActorNameSchema("du courtier").optional(),
  brokerReceiptNumber: z
    .string()
    .max(
      150,
      "Le numéro de récépissé du courtier ne doit pas excéder 150 caractères"
    )
    .optional(),
  traderSiret: getActorSiretSchema("du négociant").optional(),
  traderName: getActorNameSchema("du négociant").optional(),
  traderReceiptNumber: z
    .string()
    .max(
      150,
      "Le numéro de récépissé du négociant ne doit pas excéder 150 caractères"
    )
    .optional(),
  ecoOrganismeSiret: getActorSiretSchema("de l'éco-organisme").optional(),
  ecoOrganismeName: getActorNameSchema("de l'éco-organisme").optional(),
  operationCode: operationCodeSchema,
  documentNumber: z.string().optional(), // TODO 12 caractères & rule
  notificationNumber: z.string().optional(), // TODO 12 caractères & rule
  notificationDocumentInputNumber: z.string().optional(), // TODO rule
  transporter1TransportMode: transportModeSchema,
  transporter1Type: getActorTypeSchema("de transporteur 1"),
  transporter1OrgId: getActorOrgIdSchema("du transporteur 1"),
  transporter1ReceiptNumber: transportReceiptNumberSchema,
  transporter1Name: getActorNameSchema("du transporteur 1"),
  transporter1Address: getActorAddressSchema("du transporteur 1"),
  transporter1PostalCode: getActorCitySchema("du transporteur 1"),
  transporter1City: getActorPostalCodeSchema("du transporteur 1"),
  transporter1CountryCode: getActorCountryCodeSchema("du transporteur 1"),
  transporter2TransportMode: transportModeSchema.optional(),
  transporter2Type: getActorTypeSchema("de transporteur 2"),
  transporter2OrgId: getActorOrgIdSchema("du transporteur 2"),
  transporter2ReceiptNumber: transportReceiptNumberSchema,
  transporter2Name: getActorNameSchema("du transporteur 2"),
  transporter2Address: getActorAddressSchema("du transporteur 2"),
  transporter2PostalCode: getActorCitySchema("du transporteur 2"),
  transporter2City: getActorPostalCodeSchema("du transporteur 2"),
  transporter2CountryCode: getActorCountryCodeSchema("du transporteur 2"),
  transporter3TransportMode: transportModeSchema.optional(),
  transporter3Type: getActorTypeSchema("de transporteur 3"),
  transporter3OrgId: getActorOrgIdSchema("du transporteur 3"),
  transporter3ReceiptNumber: transportReceiptNumberSchema,
  transporter3Name: getActorNameSchema("du transporteur 3"),
  transporter3Address: getActorAddressSchema("du transporteur 3"),
  transporter3PostalCode: getActorCitySchema("du transporteur 3"),
  transporter3City: getActorPostalCodeSchema("du transporteur 3"),
  transporter3CountryCode: getActorCountryCodeSchema("du transporteur 3"),
  transporter4TransportMode: transportModeSchema.optional(),
  transporter4Type: getActorTypeSchema("de transporteur 4"),
  transporter4OrgId: getActorOrgIdSchema("du transporteur 4"),
  transporter4ReceiptNumber: transportReceiptNumberSchema,
  transporter4Name: getActorNameSchema("du transporteur 4"),
  transporter4Address: getActorAddressSchema("du transporteur 4"),
  transporter4PostalCode: getActorCitySchema("du transporteur 4"),
  transporter4City: getActorPostalCodeSchema("du transporteur 4"),
  transporter4CountryCode: getActorCountryCodeSchema("du transporteur 4"),
  transporter5TransportMode: transportModeSchema.optional(),
  transporter5Type: getActorTypeSchema("de transporteur 5"),
  transporter5OrgId: getActorOrgIdSchema("du transporteur 5"),
  transporter5ReceiptNumber: transportReceiptNumberSchema,
  transporter5Name: getActorNameSchema("du transporteur 5"),
  transporter5Address: getActorAddressSchema("du transporteur 5"),
  transporter5PostalCode: getActorCitySchema("du transporteur 5"),
  transporter5City: getActorPostalCodeSchema("du transporteur 5"),
  transporter5CountryCode: getActorCountryCodeSchema("du transporteur 5")
});

// Props added through transform
const transformedSsdSchema = z.object({
  reportForAddress: z.string().default(""),
  reportForCity: z.string().default(""),
  reportForPostalCode: z.string().default(""),
  reportForName: z.coerce.string().default("")
});

export const incomingWasteSchema =
  inputIncomingWasteSchema.merge(transformedSsdSchema);
