import {
  BspaohConsistence,
  BspaohPackagingAcceptationStatus
} from "@td/codegen-ui";
import { BspaohPackaging } from "@td/codegen-ui";

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

export const countPackagingPieces = (packagings?: BspaohPackaging[]): Number =>
{ if (!packagings){return 0}
  
  return packagings
    .map(packaging => packaging.identificationCodes?.length ?? 0)
    .reduce((acc, curr) => acc + curr, 0);}

export const datetimeToDateString = (dt: Date): string =>
  new Date(dt).toISOString().split("T")[0];

  