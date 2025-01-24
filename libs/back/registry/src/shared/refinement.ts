import { TdOperationCode, isSiret } from "@td/constants";
import { checkVAT, countries } from "jsvat";
import { Refinement, z } from "zod";
import { transportModeSchema, getWasteCodeSchema } from "./schemas";
import { OperationMode } from "@prisma/client";

export function refineActorInfos<T>({
  typeKey,
  orgIdKey,
  nameKey,
  addressKey,
  postalCodeKey,
  cityKey,
  countryKey
}: {
  typeKey: string;
  orgIdKey: string;
  nameKey: string;
  addressKey: string;
  postalCodeKey: string;
  cityKey: string;
  countryKey: string;
}): Refinement<T> {
  return (item, { addIssue }) => {
    // Refine orgId first
    const type:
      | "ETABLISSEMENT_FR"
      | "ENTREPRISE_UE"
      | "ENTREPRISE_HORS_UE"
      | "ASSOCIATION"
      | "PERSONNE_PHYSIQUE"
      | "COMMUNE" = item[typeKey];

    if (!type) {
      return;
    }

    const orgId: string = item[orgIdKey];
    const inputCountry: string | undefined = countryKey
      ? item[countryKey]
      : undefined;

    switch (type) {
      case "ETABLISSEMENT_FR": {
        if (!isSiret(orgId)) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le SIRET saisi n'est pas un SIRET valide.",
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
              "Le numéro de TVA n'est pas valide. Il commence par 2 lettres majuscules, est suivi de chiffres et doit respecter les contraintes du pays concerné",
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
              "Le numéro d'identification doit faire entre 1 et 25 caractères pour une entreprise hors UE. Il est composé de lettres majuscules et de chiffres.",
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
              "Le numéro d'identification doit faire 10 caractères pour une assoxiation. Il commence par un W suivi de 9 chiffres.",
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
      case "PERSONNE_PHYSIQUE": {
        if (!orgId) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le numéro d'identification doit contenir le nom et prénom pour une personne physique"
          });
        }
        break;
      }
      case "COMMUNE":
        break;
      default:
        throw new Error(`Unhandled destination type ${type}`);
    }

    // Then, if we have an org id, we can refine the rest of the fields
    refineActorDetails<T>({
      type,
      nameKey,
      addressKey,
      postalCodeKey,
      cityKey,
      countryKey
    });
  };
}

function refineActorDetails<T>({
  type,
  nameKey,
  addressKey,
  postalCodeKey,
  cityKey,
  countryKey
}: {
  type:
    | "ETABLISSEMENT_FR"
    | "ENTREPRISE_UE"
    | "ENTREPRISE_HORS_UE"
    | "ASSOCIATION"
    | "PERSONNE_PHYSIQUE"
    | "COMMUNE";
  nameKey: string;
  addressKey: string;
  postalCodeKey: string;
  cityKey: string;
  countryKey: string;
}): Refinement<T> {
  return (item, { addIssue }) => {
    if (type === "COMMUNE") {
      return;
    }

    if (!item[nameKey]) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: "La raison sociale est obligatoire",
        path: [nameKey]
      });
    }

    if (!item[addressKey]) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'adresse est obligatoire",
        path: [addressKey]
      });
    }

    if (!item[postalCodeKey]) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le code postal est obligatoire",
        path: [postalCodeKey]
      });
    }

    if (!item[cityKey]) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: "La commune est obligatoire",
        path: [cityKey]
      });
    }

    if (!item[countryKey]) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le code pays est obligatoire",
        path: [countryKey]
      });
    }
  };
}

export const refineIsDangerous: Refinement<{
  wasteIsDangerous?: boolean | null | undefined;
  wastePop: boolean;
  wasteCode?: z.infer<ReturnType<typeof getWasteCodeSchema>> | null;
}> = (item, { addIssue }) => {
  // No check if the value is not set
  if (item.wasteIsDangerous == null) {
    return;
  }

  if (
    (item.wastePop || item.wasteCode?.includes("*")) &&
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
  transporter1TransportMode?:
    | z.infer<typeof transportModeSchema>
    | null
    | undefined;
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
  ].some(transportMode => transportMode === "ROAD");

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
      message: `Pour les codes de traitement R 1, D 10 et D 5, le poids ne peut pas être estimé`,
      path: ["weightIsEstimate"]
    });
  }
};

export const refineWeightIsEstimate: Refinement<{
  weightIsEstimate: boolean;
  operationCode: string;
}> = (item, { addIssue }) => {
  if (
    item.weightIsEstimate &&
    ["R 1", "D 10", "D 5"].includes(item.operationCode)
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Pour les codes de traitement R 1, D 10 et D 5, le poids ne peut pas être estimé`,
      path: ["weightIsEstimate"]
    });
  }
};

export const refineMunicipalities: Refinement<{
  initialEmitterCompanyType?:
    | "ETABLISSEMENT_FR"
    | "ENTREPRISE_UE"
    | "ENTREPRISE_HORS_UE"
    | "ASSOCIATION"
    | "PERSONNE_PHYSIQUE"
    | "COMMUNE"
    | null;
  initialEmitterMunicipalitiesInseeCodes: string[];
  initialEmitterMunicipalitiesNames: string[];
}> = (item, { addIssue }) => {
  if (
    item.initialEmitterCompanyType === "COMMUNE" &&
    !item.initialEmitterMunicipalitiesInseeCodes?.length
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le ou les codes INSEE des communes doivent être saisi`,
      path: ["initialEmitterMunicipalitiesInseeCodes"]
    });
  }

  if (
    item.initialEmitterCompanyType === "COMMUNE" &&
    !item.initialEmitterMunicipalitiesNames?.length
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le ou les libellés des communes doivent être saisi`,
      path: ["initialEmitterMunicipalitiesNames"]
    });
  }

  if (
    item.initialEmitterMunicipalitiesInseeCodes?.length !==
    item.initialEmitterMunicipalitiesNames?.length
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le nombre de codes INSEE et de noms de communes doit être identique`,
      path: ["initialEmitterMunicipalitiesNames"]
    });
  }
};

export const refineNotificationNumber: Refinement<{
  wasteIsDangerous?: boolean | null | undefined;
  wastePop: boolean;
  wasteCode?: z.infer<ReturnType<typeof getWasteCodeSchema>> | null;
  declarationNumber?: string | null | undefined;
  notificationNumber?: string | null | undefined;
  nextDestinationIsAbroad?: boolean | null | undefined;
}> = (item, { addIssue }) => {
  const isDangerous =
    item.wasteIsDangerous || item.wastePop || item.wasteCode?.includes("*");

  if (!item.notificationNumber && isDangerous && item.nextDestinationIsAbroad) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le numéro de notification est obligatoire lorsque le déchet est dangereux et que la destination ultérieure est à l'étranger`,
      path: ["notificationNumber"]
    });
  }

  if (!item.declarationNumber && !isDangerous && item.nextDestinationIsAbroad) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le numéro de déclaration est obligatoire lorsque le déchet est non dangereux et que la destination ultérieure est à l'étranger`,
      path: ["declarationNumber"]
    });
  }
};

export const refineOperationMode: Refinement<{
  operationCode: TdOperationCode;
  operationMode?: OperationMode | null;
}> = (item, { addIssue }) => {
  const nonFinalOperationCodes = [
    "R 12",
    "R 13",
    "D 9",
    "D 13",
    "D 14",
    "D 15"
  ];
  const isFinalOperationCode = !nonFinalOperationCodes.some(
    code => code === item.operationCode
  );

  if (isFinalOperationCode && !item.operationMode) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le mode de traitement est requis lorsqu'un code de traitement final a été renseigné`,
      path: ["operationMode"]
    });
  }
};

export const refineFollowingTraceabilityInfos: Refinement<{
  operationCode: TdOperationCode;
  noTraceability?: boolean | null;
  nextDestinationIsAbroad?: boolean | null;
  nextOperationCode?: TdOperationCode | null;
}> = (item, { addIssue }) => {
  const nonFinalOperationCodes = [
    "R 12",
    "R 13",
    "D 9",
    "D 13",
    "D 14",
    "D 15"
  ];
  const isFinalOperationCode = !nonFinalOperationCodes.some(
    code => code === item.operationCode
  );

  if (!isFinalOperationCode && item.noTraceability == null) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `L'information sur la rupture de traçabilité est requise pour les codes de traitement non finaux`,
      path: ["noTraceability"]
    });
  }

  if (!isFinalOperationCode && item.nextOperationCode == null) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le code de traitement ultérieur prévue est requis pour les codes de traitement non finaux`,
      path: ["nextOperationCode"]
    });
  }

  if (item.noTraceability === false && item.nextDestinationIsAbroad == null) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Lorsque la rupture de traçabilité n'est pas autorisée, il faut indiquer si la destination ultérieure est à l'étranger ou pas`,
      path: ["nextDestinationIsAbroad"]
    });
  }
};

export const refineTransportersConsistency: Refinement<{
  isDirectSupply?: boolean | null;
  transporter1CompanyOrgId?: string | null;
  transporter2CompanyOrgId?: string | null;
  transporter3CompanyOrgId?: string | null;
  transporter4CompanyOrgId?: string | null;
  transporter5CompanyOrgId?: string | null;
}> = (item, { addIssue }) => {
  if (item.isDirectSupply && item.transporter1CompanyOrgId) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le transporteur ne doit pas être renseigné pour une fourniture directe`,
      path: ["transporter1CompanyOrgId"]
    });
  }

  if (!item.isDirectSupply && !item.transporter1CompanyOrgId) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le transporteur 1 doit être renseigné si le déchet n'est pas envoyé via fourniture directe`,
      path: ["transporter1CompanyOrgId"]
    });
  }

  if (item.transporter2CompanyOrgId && !item.transporter1CompanyOrgId) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le transporteur 2 ne doit pas être renseigné si le transporteur 1 ne l'est pas`,
      path: ["transporter2CompanyOrgId"]
    });
  }
  if (item.transporter3CompanyOrgId && !item.transporter2CompanyOrgId) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le transporteur 3 ne doit pas être renseigné si le transporteur 2 ne l'est pas`,
      path: ["transporter3CompanyOrgId"]
    });
  }
  if (item.transporter4CompanyOrgId && !item.transporter3CompanyOrgId) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le transporteur 4 ne doit pas être renseigné si le transporteur 3 ne l'est pas`,
      path: ["transporter4CompanyOrgId"]
    });
  }
  if (item.transporter5CompanyOrgId && !item.transporter4CompanyOrgId) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le transporteur 5 ne doit pas être renseigné si le transporteur 4 ne l'est pas`,
      path: ["transporter5CompanyOrgId"]
    });
  }
};

export const parcelRefinement: Refinement<{
  parcelCoordinates: string[];
  parcelNumbers: string[];
  parcelInseeCodes: string[];
  isUpcycled?: boolean | null;
  destinationParcelCoordinates: string[];
  destinationParcelNumbers: string[];
  nextDestinationIsAbroad?: boolean | null;
}> = (item, { addIssue }) => {
  if (
    !item.parcelCoordinates.length &&
    !item.parcelNumbers.length &&
    !item.parcelInseeCodes.length
  ) {
    addIssue({
      code: "custom",
      message:
        "Vous devez renseigner soit les codes INSEE et numéros des parcelles, soit les coordonnées de parcelles",
      path: ["parcelCoordinates"]
    });
  }

  if (
    item.parcelNumbers.length &&
    item.parcelInseeCodes.length &&
    item.parcelNumbers.length !== item.parcelInseeCodes.length
  ) {
    addIssue({
      code: "custom",
      message:
        "Vous devez renseigner le même nombre de codes INSEE des parcelles que de numéros des parcelles",
      path: ["parcelNumbers"]
    });
  }

  if (item.isUpcycled == null && item.nextDestinationIsAbroad === false) {
    addIssue({
      code: "custom",
      message:
        "Vous devez renseigner si les terres sont valorisées ou non lorsque la destination n'est pas à l'étranger",
      path: ["isUpcycled"]
    });
  }

  if (
    item.isUpcycled &&
    !item.destinationParcelCoordinates.length &&
    !item.destinationParcelNumbers.length
  ) {
    addIssue({
      code: "custom",
      message:
        "Vous devez renseigner soit les numéros de parcelles de destination, soit les coordonnées de parcelles de destination",
      path: ["destinationParcelCoordinates"]
    });
  }
};
