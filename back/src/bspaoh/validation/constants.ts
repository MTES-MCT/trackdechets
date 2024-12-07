import { Bspaoh, BspaohTransporter } from "@prisma/client";
import type { BspaohSignatureType } from "@td/codegen-back";

type SignatureField = Pick<
  Bspaoh,
  | "emitterEmissionSignatureDate"
  | "handedOverToDestinationSignatureDate"
  | "destinationReceptionSignatureDate"
  | "destinationOperationSignatureDate"
> &
  Pick<BspaohTransporter, "transporterTransportSignatureDate">;

export const SIGNATURES_HIERARCHY: {
  [key in BspaohSignatureType]: {
    field: keyof SignatureField;
    next?: BspaohSignatureType;
  };
} = {
  EMISSION: { field: "emitterEmissionSignatureDate", next: "TRANSPORT" },

  TRANSPORT: {
    field: "transporterTransportSignatureDate",
    next: "RECEPTION"
  },
  DELIVERY: {
    field: "handedOverToDestinationSignatureDate",
    next: "RECEPTION"
  },
  RECEPTION: { field: "destinationReceptionSignatureDate", next: "OPERATION" },
  OPERATION: { field: "destinationOperationSignatureDate" }
};
