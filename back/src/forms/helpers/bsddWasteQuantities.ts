import Decimal from "decimal.js";

interface BsddQuantities {
  quantityAccepted: Decimal;
  quantityRefused: Decimal | null;
}
export const bsddWasteQuantities = ({
  wasteAcceptationStatus,
  quantityReceived,
  quantityRefused
}: {
  wasteAcceptationStatus?: string | null;
  quantityReceived?: Decimal | number | null;
  quantityRefused?: Decimal | number | null;
}): BsddQuantities | null => {
  // BSDD hasn't been received yet
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
    quantityAccepted = new Decimal(quantityReceived).minus(
      new Decimal(quantityRefused)
    );
  }

  return {
    quantityAccepted,
    quantityRefused: new Decimal(quantityRefused)
  };
};
