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
} from "../generated/graphql/types";
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
