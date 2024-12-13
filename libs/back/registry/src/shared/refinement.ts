import { isSiret } from "@td/constants";
import { checkVAT, countries } from "jsvat";
import { Refinement, z } from "zod";
import { transportModeSchema, wasteCodeSchema } from "./schemas";

export function refineActorOrgId<T>({
  typeKey,
  orgIdKey,
  countryKey
}: {
  typeKey: string;
  orgIdKey: string;
  countryKey?: string;
}): Refinement<T> {
  return (item, { addIssue }) => {
    const type:
      | "ENTREPRISE_FR"
      | "ENTREPRISE_UE"
      | "ENTREPRISE_HORS_UE"
      | "ASSOCIATION"
      | "PERSONNE_PHYSIQUE"
      | "COMMUNE" = item[typeKey];
    const orgId: string = item[orgIdKey];
    const inputCountry: string | undefined = countryKey
      ? item[countryKey]
      : undefined;

    switch (type) {
      case "ENTREPRISE_FR": {
        if (!isSiret(orgId)) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le SIRET du destinataire n'est pas un SIRET valide.",
            path: [orgIdKey]
          });
        }

        if (countryKey && inputCountry && inputCountry !== "FR") {
          addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le code pays doit être FR pour une entreprise française",
            path: [countryKey]
          });
        }
        break;
      }
      case "ENTREPRISE_UE": {
        const { isValid, country } = checkVAT(orgId, countries);
        if (!isValid) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le numéro de TVA du destinataire n'est pas valide. Il commence par 2 lettres majuscules, est suivi de chiffres et doit respecter les contraintes du pays concerné",
            path: [orgIdKey]
          });
        }

        if (
          country &&
          countryKey &&
          inputCountry &&
          country.isoCode.short !== inputCountry
        ) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le code pays ne correspond pas au code pays de la TVA saisie",
            path: [countryKey]
          });
        }
        break;
      }
      case "ENTREPRISE_HORS_UE": {
        const isOrgIdValidOutOfUe = orgId && /[A-Z0-9]{1,25}/.test(orgId);
        if (!isOrgIdValidOutOfUe) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le numéro d'identification du destinataire doit faire entre 1 et 25 caractères pour une entreprise hors UE. Il est composé de lettres majuscules et de chiffres.",
            path: [orgIdKey]
          });
        }
        break;
      }
      case "ASSOCIATION": {
        const isOrgIdValidAssociation = orgId && /W[0-9]{9}/.test(orgId);
        if (!isOrgIdValidAssociation) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le numéro d'identification du destinataire doit faire 10 caractères pour une assoxiation. Il commence par un W suivi de 9 chiffres.",
            path: [orgIdKey]
          });
        }

        if (countryKey && inputCountry && inputCountry !== "FR") {
          addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le code pays doit être FR pour une association française",
            path: [countryKey]
          });
        }
        break;
      }
      default:
        throw new Error("Unhandled destination type");
    }
  };
}

export const refineIsDangerous: Refinement<{
  wasteIsDangerous?: boolean | null | undefined;
  wastePop: boolean;
  wasteCode: z.infer<typeof wasteCodeSchema>;
}> = (item, { addIssue }) => {
  // No check if the value is not set
  if (item.wasteIsDangerous == null) {
    return;
  }

  if (
    (item.wastePop || item.wasteCode.includes("*")) &&
    !item.wasteIsDangerous
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le déchet contient des POP ou a un code déchet avec étoile, il ne peut pas être indiqué comme non dangereux`,
      path: ["wasteIsDangerous"]
    });
  }
};

export const refineWeightAndVolume: Refinement<{
  transporter1TransportMode: z.infer<typeof transportModeSchema>;
  transporter2TransportMode?:
    | z.infer<typeof transportModeSchema>
    | null
    | undefined;
  transporter3TransportMode?:
    | z.infer<typeof transportModeSchema>
    | null
    | undefined;
  transporter4TransportMode?:
    | z.infer<typeof transportModeSchema>
    | null
    | undefined;
  transporter5TransportMode?:
    | z.infer<typeof transportModeSchema>
    | null
    | undefined;
  weightValue: number;
  volume?: number | null | undefined;
  weightIsEstimate: boolean;
  operationCode: string;
}> = (item, { addIssue }) => {
  const isUsingRoad = [
    item.transporter1TransportMode,
    item.transporter2TransportMode,
    item.transporter3TransportMode,
    item.transporter4TransportMode,
    item.transporter5TransportMode
  ].some(transportMode => transportMode === "ROUTE");

  if (isUsingRoad && item.weightValue > 40) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le poids ne peut pas dépasser 40 tonnes lorsque le déchet est transporté par la route`,
      path: ["weightValue"]
    });
  }

  if (isUsingRoad && item.volume && item.volume > 40) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le volume ne peut pas dépasser 40 M3 lorsque le déchet est transporté par la route`,
      path: ["volume"]
    });
  }

  if (
    item.weightIsEstimate &&
    ["R 1", "D 10", "D 5"].includes(item.operationCode)
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Pour les codes opération R 1, D 10 et D 5, le poids ne peut pas être estimé`,
      path: ["weightIsEstimate"]
    });
  }
};

export const refineMunicipalities: Refinement<{
  producerType:
    | "ENTREPRISE_FR"
    | "ENTREPRISE_UE"
    | "ENTREPRISE_HORS_UE"
    | "ASSOCIATION"
    | "PERSONNE_PHYSIQUE"
    | "COMMUNE";
  municipalitiesInseeCodes: string[];
  municipalitiesNames: string[];
}> = (item, { addIssue }) => {
  if (
    item.producerType === "COMMUNE" &&
    !item.municipalitiesInseeCodes?.length
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le ou les codes INSEE des communes doivent être saisi`,
      path: ["municipalitiesInseeCodes"]
    });
  }

  if (item.producerType === "COMMUNE" && !item.municipalitiesNames?.length) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le ou les libellés des communes doivent être saisi`,
      path: ["municipalitiesNames"]
    });
  }

  if (
    item.municipalitiesInseeCodes?.length !== item.municipalitiesNames?.length
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le nombre de codes INSEE et de noms de communes doit être identique`,
      path: ["municipalitiesNames"]
    });
  }
};

export const refineNotificationNumber: Refinement<{
  wasteIsDangerous?: boolean | null | undefined;
  wastePop: boolean;
  wasteCode: z.infer<typeof wasteCodeSchema>;
  notificationNumber?: string | null | undefined;
  nextDestinationIsAbroad?: boolean | null | undefined;
}> = (item, { addIssue }) => {
  const isDangerous =
    item.wasteIsDangerous || item.wastePop || item.wasteCode.includes("*");

  if (!item.notificationNumber && isDangerous && item.nextDestinationIsAbroad) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le uméro de notification est obligatoire lorsque le déchet est dangereux et que la destination ultérieure est à l'étranger`,
      path: ["notificationNumber"]
    });
  }
};
