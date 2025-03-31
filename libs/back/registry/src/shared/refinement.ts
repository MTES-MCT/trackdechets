import { TdOperationCode, isSiret } from "@td/constants";
import { checkVAT, countries } from "jsvat";
import { Refinement, z } from "zod";
import { getWasteCodeSchema } from "./schemas";
import { OperationMode } from "@prisma/client";

export function refineTransporterInfos<T>({
  modeKey,
  typeKey,
  orgIdKey,
  nameKey,
  addressKey,
  postalCodeKey,
  cityKey,
  countryKey,
  recepisseIsExemptedKey,
  recepisseNumberKey
}: {
  modeKey: string;
  typeKey: string;
  orgIdKey: string;
  nameKey: string;
  addressKey: string;
  postalCodeKey: string;
  cityKey: string;
  countryKey: string;
  recepisseIsExemptedKey: string;
  recepisseNumberKey: string;
}): Refinement<T> {
  return (item, context) => {
    if (item[modeKey] && !item[typeKey]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Le mode de transport ne peut être renseigné que si les informations du transporteur le sont également",
        path: [typeKey]
      });
    }

    if (!item[typeKey]) {
      return;
    }

    if (!item[recepisseIsExemptedKey] && !item[recepisseNumberKey]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Le numéro de récépissé est obligatoire si le transporteur n'indique pas en être exempté",
        path: [recepisseNumberKey]
      });
    }

    refineActorInfos({
      typeKey,
      orgIdKey,
      nameKey,
      addressKey,
      postalCodeKey,
      cityKey,
      countryKey
    })(item, context);
  };
}

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
  return (item, context) => {
    // Refine orgId first
    const type:
      | "ETABLISSEMENT_FR"
      | "ENTREPRISE_UE"
      | "ENTREPRISE_HORS_UE"
      | "ASSOCIATION"
      | "PERSONNE_PHYSIQUE"
      | "COMMUNES" = item[typeKey];

    if (!type) {
      if (
        item[orgIdKey] ||
        item[nameKey] ||
        item[addressKey] ||
        item[postalCodeKey] ||
        item[cityKey] ||
        item[countryKey]
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Le type d'entreprise est obligatoire si des champs concernant l'entreprise sont renseignés",
          path: [typeKey]
        });
      }
      return;
    }

    const orgId: string = item[orgIdKey];
    const inputCountry: string | undefined = countryKey
      ? item[countryKey]
      : undefined;

    switch (type) {
      case "ETABLISSEMENT_FR": {
        if (!orgId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le SIRET doit être saisi pour un établissement français",
            path: [orgIdKey]
          });
        } else if (!isSiret(orgId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le SIRET saisi n'est pas un SIRET valide",
            path: [orgIdKey]
          });
        }

        if (countryKey && inputCountry && inputCountry !== "FR") {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le code pays doit être FR pour une entreprise française",
            path: [countryKey]
          });
        }

        const postalCode = item[postalCodeKey];
        const isValidPostalCode = /^[0-9]{5,6}$/.test(postalCode);
        if (!isValidPostalCode) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le code postal doit être composé de 5 ou 6 chiffres pour une entreprise française",
            path: [postalCodeKey]
          });
        }
        break;
      }
      case "ENTREPRISE_UE": {
        const { isValid, country } = checkVAT(orgId, countries);
        if (!isValid) {
          context.addIssue({
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
          context.addIssue({
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
          context.addIssue({
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
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le numéro d'identification doit faire 10 caractères pour une association. Il commence par un W suivi de 9 chiffres.",
            path: [orgIdKey]
          });
        }

        if (countryKey && inputCountry && inputCountry !== "FR") {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le code pays doit être FR pour une association française",
            path: [countryKey]
          });
        }
        break;
      }
      case "PERSONNE_PHYSIQUE": {
        if (!orgId) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le numéro d'identification doit contenir le nom et prénom pour une personne physique"
          });
        }
        break;
      }
      case "COMMUNES":
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
    })(item, context);
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
    | "COMMUNES";
  nameKey: string;
  addressKey: string;
  postalCodeKey: string;
  cityKey: string;
  countryKey: string;
}): Refinement<T> {
  return (item, { addIssue }) => {
    if (type === "COMMUNES") {
      return;
    }

    if (!item[nameKey] && type !== "PERSONNE_PHYSIQUE") {
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
    | "COMMUNES"
    | null;
  initialEmitterMunicipalitiesInseeCodes: string[];
}> = (item, { addIssue }) => {
  if (
    item.initialEmitterCompanyType === "COMMUNES" &&
    !item.initialEmitterMunicipalitiesInseeCodes?.length
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le ou les codes INSEE des communes doivent être saisi`,
      path: ["initialEmitterMunicipalitiesInseeCodes"]
    });
  }
};

export const refineGistridNumber: Refinement<{
  wasteIsDangerous?: boolean | null | undefined;
  wastePop: boolean;
  wasteCode?: z.infer<ReturnType<typeof getWasteCodeSchema>> | null;
  gistridNumber?: string | null | undefined;
  nextDestinationIsAbroad?: boolean | null | undefined;
}> = (item, { addIssue }) => {
  const isDangerous =
    item.wasteIsDangerous || item.wastePop || item.wasteCode?.includes("*");

  if (!item.gistridNumber && isDangerous && item.nextDestinationIsAbroad) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le numéro de notification ou de déclaration est obligatoire lorsque le déchet est dangereux et que la destination ultérieure est à l'étranger`,
      path: ["gistridNumber"]
    });
  }
};

export const refineRequiredOperationMode: Refinement<{
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

export const refineOperationModeConsistency: Refinement<{
  operationCode: TdOperationCode;
  operationMode?: OperationMode | null;
}> = (item, { addIssue }) => {
  if (
    item.operationCode.startsWith("D") &&
    item.operationMode &&
    item.operationMode !== OperationMode.ELIMINATION
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le mode de traitement doit obligatoirement être Élimination lorsque le code de traitement commence par D`,
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

export const requiredParcelsRefinement: Refinement<{
  parcelCoordinates: string[];
  parcelNumbers: string[];
  parcelInseeCodes: string[];
}> = async (item, { addIssue }) => {
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

  if (item.parcelNumbers.length !== item.parcelInseeCodes.length) {
    addIssue({
      code: "custom",
      message:
        "Vous devez renseigner autant de codes INSEE de parcelles que de numéros des parcelles",
      path: ["parcelCoordinates"]
    });
  }
};

export const refineOperationCodeWhenUpcycled: Refinement<{
  isUpcycled?: boolean | null;
  operationCode: string;
}> = async (item, { addIssue }) => {
  if (item.isUpcycled && !item.operationCode.startsWith("R")) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Lorsque la terre est valorisée, le code de traitement réalisé doit obligatoirement commencer par un "R" (pas de code de traitement d'élimination)`,
      path: ["operationCode"]
    });
  }
};

export const refineEcoOrgBrokerAndTrader: Refinement<{
  ecoOrganismeSiret?: string | null;
  ecoOrganismeName?: string | null;
  brokerCompanySiret?: string | null;
  brokerCompanyName?: string | null;
  brokerRecepisseNumber?: string | null;
  traderCompanySiret?: string | null;
  traderCompanyName?: string | null;
  traderRecepisseNumber?: string | null;
}> = async (item, { addIssue }) => {
  if (item.ecoOrganismeSiret && !item.ecoOrganismeName) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `La raison sociale de l'éco-organisme est obligatoire si le SIRET est renseigné`,
      path: ["ecoOrganismeName"]
    });
  }

  if (item.brokerCompanySiret) {
    if (!item.brokerCompanyName) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: `La raison sociale du courtier est obligatoire si le SIRET est renseigné`,
        path: ["brokerCompanyName"]
      });
    }

    if (!item.brokerRecepisseNumber) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le numéro de récépissé du courtier est obligatoire si le SIRET est renseigné`,
        path: ["brokerRecepisseNumber"]
      });
    }
  }

  if (item.traderCompanySiret) {
    if (!item.traderCompanyName) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: `La raison sociale du négociant est obligatoire si le SIRET est renseigné`,
        path: ["traderCompanyName"]
      });
    }

    if (!item.traderRecepisseNumber) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le numéro de récépissé du négociant est obligatoire si le SIRET est renseigné`,
        path: ["traderRecepisseNumber"]
      });
    }
  }
};
