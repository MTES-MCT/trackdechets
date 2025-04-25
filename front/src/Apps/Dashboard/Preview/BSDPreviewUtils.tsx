import { WasteAcceptationStatus } from "@td/codegen-ui";

export const getVerboseAcceptationStatus = (
  acceptationStatus: WasteAcceptationStatus | null | undefined | string
): string => {
  if (!acceptationStatus) {
    return "";
  }
  const verbose = {
    ACCEPTED: "Acceptation totale",
    REFUSED: "Refus total",
    PARTIALLY_REFUSED: "Refus partiel"
  };

  return verbose[acceptationStatus];
};
