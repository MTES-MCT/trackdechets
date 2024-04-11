interface BsddQuantities {
  wasteAcceptationStatus: string;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRefused: number | null;
}
export const bsddQuantities = ({
  wasteAcceptationStatus,
  quantityReceived,
  quantityRefused
}: {
  wasteAcceptationStatus?: string;
  quantityReceived?: number;
  quantityRefused?: number;
}): BsddQuantities | null => {
  // BSDD hasn't been received yet
  if (!wasteAcceptationStatus || !quantityReceived) {
    return null;
  }

  // Use-case n°1: everything was accepted
  if (wasteAcceptationStatus === "ACCEPTED") {
    return {
      wasteAcceptationStatus,
      quantityReceived,
      quantityAccepted: quantityReceived,
      quantityRefused: 0
    };
  }

  // Use-case n°2: everything was refused
  if (wasteAcceptationStatus === "REFUSED") {
    return {
      wasteAcceptationStatus,
      quantityReceived,
      quantityAccepted: 0,
      quantityRefused: quantityReceived
    };
  }

  // Use-case n°3: partial acceptance
  if (wasteAcceptationStatus === "PARTIALLY_REFUSED") {
    // So that we can distinguish legacy BSDs from new ones, leave
    // quantityRefused if not filled
    return {
      wasteAcceptationStatus,
      quantityReceived,
      quantityAccepted: quantityReceived - (quantityRefused ?? 0),
      quantityRefused: quantityRefused ?? null
    };
  }

  return null;
};
