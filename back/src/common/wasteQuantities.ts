import Decimal from "decimal.js";

export interface WasteQuantities {
  quantityAccepted: Decimal;
  quantityRefused: Decimal;
}
export const wasteQuantities = ({
  wasteAcceptationStatus,
  quantityReceived,
  quantityRefused
}: {
  wasteAcceptationStatus?: string | null;
  quantityReceived?: Decimal | number | null;
  quantityRefused?: Decimal | number | null;
}): WasteQuantities | null => {
  // BSD hasn't been received yet
  if (
    !wasteAcceptationStatus ||
    quantityReceived === null ||
    quantityReceived === undefined
  ) {
    return null;
  }

  // Legacy
  if (quantityRefused === null || quantityRefused === undefined) {
    return null;
  }

  // ACCEPTED
  let quantityAccepted = new Decimal(quantityReceived);
  if (wasteAcceptationStatus === "REFUSED") {
    quantityAccepted = new Decimal(0);
  } else if (wasteAcceptationStatus === "PARTIALLY_REFUSED") {
    quantityAccepted = new Decimal(quantityReceived)
      .minus(new Decimal(quantityRefused))
      .toDecimalPlaces(6);
  }

  return {
    quantityAccepted,
    quantityRefused: new Decimal(quantityRefused).toDecimalPlaces(6)
  };
};
