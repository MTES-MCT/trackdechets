import {
  Form,
  TemporaryStorageDetail,
  TransportSegment
} from "../generated/prisma-client";

/**
 * A Prisma Form with linked objects
 */
export interface FullForm extends Form {
  temporaryStorageDetail: TemporaryStorageDetail;
  transportSegments: TransportSegment[];
}

export type FormSirets = Pick<
  Form,
  | "emitterCompanySiret"
  | "recipientCompanySiret"
  | "transporterCompanySiret"
  | "traderCompanySiret"
  | "ecoOrganismeSiret"
> & {
  temporaryStorageDetail?: Pick<
    TemporaryStorageDetail,
    "transporterCompanySiret" | "destinationCompanySiret"
  >;
} & {
  transportSegments?: Pick<TransportSegment, "transporterCompanySiret">[];
};
