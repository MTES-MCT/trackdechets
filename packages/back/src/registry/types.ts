import {
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste,
  PageInfo,
  QueryIncomingWastesArgs,
  QueryManagedWastesArgs,
  QueryOutgoingWastesArgs,
  QueryTransportedWastesArgs,
  AllWaste
} from "@trackdechets/codegen/src/back.gen";
import {
  Bsda,
  Bsdasri,
  Bsff,
  Bsvhu,
  Form,
  TemporaryStorageDetail
} from "@prisma/client";
import { integer } from "@elastic/elasticsearch/api/types";

export type GenericWaste =
  | IncomingWaste
  | OutgoingWaste
  | TransportedWaste
  | ManagedWaste
  | AllWaste;

export type PaginationArgs = {
  first: number;
  after: string;
  last: number;
  before: string;
};

export type QueryWastesArgs =
  | QueryIncomingWastesArgs
  | QueryOutgoingWastesArgs
  | QueryManagedWastesArgs
  | QueryTransportedWastesArgs;

export type WasteEdge<WasteType extends GenericWaste> = {
  cursor: string;
  node: WasteType;
};

export type WasteConnection<WasteType extends GenericWaste> = {
  totalCount: integer;
  pageInfo: PageInfo;
  edges: WasteEdge<WasteType>[];
};

export interface BsdsToWastesConverter<Waste> {
  BSDD: (
    bsd: Form & {
      temporaryStorageDetail: TemporaryStorageDetail;
      appendix2Forms: Form[];
    },
    sirets: string[]
  ) => Waste[];
  BSDA: (bsda: Bsda & { forwarding: Bsda } & { grouping: Bsda[] }) => Waste;
  BSDASRI: (bsdasri: Bsdasri & { grouping: Bsdasri[] }) => Waste;
  BSVHU: (bsvhu: Bsvhu) => Waste;
  BSFF: (
    bsff: Bsff & { forwarding: Bsff } & { repackaging: Bsff[] } & {
      grouping: Bsff[];
    }
  ) => Waste;
}
