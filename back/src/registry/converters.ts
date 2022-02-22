import {
  toIncomingWaste as bsffToIncomingWaste,
  toOutgoingWaste as bsffToOutgoingWaste,
  toTransportedWaste as bsffToTransportedWaste,
  toManagedWaste as bsffToManagedWaste,
  toAllWaste as bsffToAllWaste
} from "../bsffs/registry";
import {
  toIncomingWaste as bsdaToIncomingWaste,
  toOutgoingWaste as bsdaToOutgoingWaste,
  toTransportedWaste as bsdaToTransportedWaste,
  toManagedWaste as bsdaToManagedWaste,
  toAllWaste as bsdaToAllWaste
} from "../bsda/registry";
import {
  toIncomingWaste as bsvhuToIncomingWaste,
  toOutgoingWaste as bsvhuToOutgoingWaste,
  toTransportedWaste as bsvhuToTransportedWaste,
  toManagedWaste as bsvhuToManagedWaste,
  toAllWaste as bsvhuToAllWaste
} from "../bsvhu/registry";
import {
  toIncomingWaste as bsdasriToIncomingWaste,
  toOutgoingWaste as bsdasriToOutgoingWaste,
  toTransportedWaste as bsdasriToTransportedWaste,
  toManagedWaste as bsdasriToManagedWaste,
  toAllWaste as bsdasriToAllWaste
} from "../bsdasris/registry";
import {
  toIncomingWastes as formToIncomingWastes,
  toOutgoingWastes as formToOutgoingWastes,
  toTransportedWastes as formToTransportedWastes,
  toManagedWastes as formToManagedWastes,
  toAllWastes as formToAllWastes
} from "../forms/registry";

import { GenericWaste } from "./types";
import { PrismaBsdMap } from "../common/elastic";
import { WasteRegistryType } from "../generated/graphql/types";

const bsdsToIncomingWastes = {
  BSDD: formToIncomingWastes,
  BSDA: bsdaToIncomingWaste,
  BSDASRI: bsdasriToIncomingWaste,
  BSVHU: bsvhuToIncomingWaste,
  BSFF: bsffToIncomingWaste
};

const bsdsToOutgoingWastes = {
  BSDD: formToOutgoingWastes,
  BSDA: bsdaToOutgoingWaste,
  BSDASRI: bsdasriToOutgoingWaste,
  BSVHU: bsvhuToOutgoingWaste,
  BSFF: bsffToOutgoingWaste
};

const bsdsToTransportedWastes = {
  BSDD: formToTransportedWastes,
  BSDA: bsdaToTransportedWaste,
  BSDASRI: bsdasriToTransportedWaste,
  BSVHU: bsvhuToTransportedWaste,
  BSFF: bsffToTransportedWaste
};

const bsdsToManagedWastes = {
  BSDD: formToManagedWastes,
  BSDA: bsdaToManagedWaste,
  BSDASRI: bsdasriToManagedWaste,
  BSVHU: bsvhuToManagedWaste,
  BSFF: bsffToManagedWaste
};

const bsdsToAllWastes = {
  BSDD: formToAllWastes,
  BSDA: bsdaToAllWaste,
  BSDASRI: bsdasriToAllWaste,
  BSVHU: bsvhuToAllWaste,
  BSFF: bsffToAllWaste
};

const bsdsToWastes: Record<WasteRegistryType, any> = {
  INCOMING: bsdsToIncomingWastes,
  OUTGOING: bsdsToOutgoingWastes,
  TRANSPORTED: bsdsToTransportedWastes,
  MANAGED: bsdsToManagedWastes,
  ALL: bsdsToAllWastes
};

type WasteMap<WasteType> = {
  BSDD: WasteType[];
  BSDA: WasteType[];
  BSDASRI: WasteType[];
  BSVHU: WasteType[];
  BSFF: WasteType[];
};

export function toWastes<WasteType extends GenericWaste>(
  registryType: WasteRegistryType,
  sirets: string[],
  bsds: PrismaBsdMap
): WasteMap<WasteType> {
  const converter = bsdsToWastes[registryType];
  const { bsdds, bsdas, bsdasris, bsvhus, bsffs } = bsds;

  return {
    BSDD: bsdds.map(bsd => converter.BSDD(bsd, sirets)).flat(),
    BSDASRI: bsdasris.map(converter.BSDASRI),
    BSVHU: bsvhus.map(converter.BSVHU),
    BSDA: bsdas.map(converter.BSDA),
    BSFF: bsffs.map(converter.BSFF)
  };
}
