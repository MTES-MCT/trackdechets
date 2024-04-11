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
  console.log(">> bsddWasteQuantities");
  console.log("wasteAcceptationStatus", wasteAcceptationStatus);
  console.log("quantityReceived", quantityReceived);
  console.log("quantityRefused", quantityRefused);
  // BSDD hasn't been received yet
  if (!wasteAcceptationStatus || !quantityReceived) {
    return null;
  }

  // Use-case n°1: everything was accepted
  if (wasteAcceptationStatus === "ACCEPTED") {
    return {
      quantityAccepted: new Decimal(quantityReceived),
      quantityRefused: new Decimal(0)
    };
  }

  // Use-case n°2: everything was refused
  if (wasteAcceptationStatus === "REFUSED") {
    return {
      quantityAccepted: new Decimal(0),
      quantityRefused: new Decimal(quantityReceived)
    };
  }

  // Use-case n°3: partial acceptance
  if (wasteAcceptationStatus === "PARTIALLY_REFUSED") {
    // So that we can distinguish legacy BSDs from new ones, leave
    // quantityRefused if not filled
    return {
      quantityAccepted: new Decimal(quantityReceived).minus(
        quantityRefused ?? 0
      ),
      quantityRefused: quantityRefused ? new Decimal(quantityRefused) : null
    };
  }

  return null;
};
