import {
  BspaohConsistence,
  BspaohPackagingAcceptationStatus,
  BspaohPackaging
} from "@td/codegen-ui";
import { format } from "date-fns";

export const verbosePackagings = {
  RELIQUAIRE: "Reliquaire",
  LITTLE_BOX: "Petite boîte",
  BIG_BOX: "Grande boîte"
};

export const verboseTypes = {
  FOETUS: "Foetus",
  PAOH: "PAOH"
};
export const getVerbosePackagingType = (type: string) =>
  verbosePackagings[type];

export const getVerboseType = (type: string | undefined) => {
  if (!type) {
    return verboseTypes.PAOH;
  }
  return verboseTypes[type];
};

export const getVerboseConsistence = (
  consistence: BspaohConsistence | null | undefined
) => {
  if (!consistence) {
    return "";
  }
  return consistence === "SOLIDE" ? "Solide" : "Siquide";
};

export const getVerbosePaohPackagingsAcceptationStatus = (
  acceptationStatus:
    | BspaohPackagingAcceptationStatus
    | null
    | undefined
    | string
): string => {
  if (!acceptationStatus) {
    return "";
  }
  const verbose = {
    ACCEPTED: "Accepté",
    REFUSED: "Refusé",
    PENDING: "En attente"
  };
  return verbose[acceptationStatus];
};

export const getSumPackagings = (
  packagings?: BspaohPackaging[]
): Record<string, number> => {
  if (!packagings) {
    return {};
  }
  return packagings.reduce((acc, { type }) => {
    acc[type] ??= 0;
    acc[type] += 1;
    return acc;
  }, {});
};

export const countPackagingPieces = (
  packagings?: BspaohPackaging[] | null | undefined
): number => {
  if (!packagings) {
    return 0;
  }

  return packagings
    .map(packaging => packaging.identificationCodes?.length ?? 0)
    .reduce((acc, curr) => acc + curr, 0);
};

// YYYY-MM-DD
export const datetimeToYYYYMMDD = (dt: Date): string =>
  format(new Date(dt), "yyyy-MM-dd");

// YYYY-MM-DDTHH:mm - for datetime-local inputs
export const datetimeToYYYYMMDDHHSS = (dt: Date): string =>
  format(new Date(dt), "yyyy-MM-dd'T'HH:mm");
