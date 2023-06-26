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
  toIncomingWaste as formToIncomingWaste,
  toOutgoingWaste as formToOutgoingWaste,
  toTransportedWaste as formToTransportedWaste,
  toManagedWaste as formToManagedWaste,
  toAllWaste as formToAllWaste
} from "../forms/registry";

import { GenericWaste } from "./types";
import { WasteRegistryType } from "../generated/graphql/types";
import { formToBsdd } from "../forms/compat";
import { RegistryBsdMap } from "./elastic";

const bsdsToIncomingWastes = {
  BSDD: formToIncomingWaste,
  BSDA: bsdaToIncomingWaste,
  BSDASRI: bsdasriToIncomingWaste,
  BSVHU: bsvhuToIncomingWaste,
  BSFF: bsffToIncomingWaste
};

const bsdsToOutgoingWastes = {
  BSDD: formToOutgoingWaste,
  BSDA: bsdaToOutgoingWaste,
  BSDASRI: bsdasriToOutgoingWaste,
  BSVHU: bsvhuToOutgoingWaste,
  BSFF: bsffToOutgoingWaste
};

const bsdsToTransportedWastes = {
  BSDD: formToTransportedWaste,
  BSDA: bsdaToTransportedWaste,
  BSDASRI: bsdasriToTransportedWaste,
  BSVHU: bsvhuToTransportedWaste,
  BSFF: bsffToTransportedWaste
};

const bsdsToManagedWastes = {
  BSDD: formToManagedWaste,
  BSDA: bsdaToManagedWaste,
  BSDASRI: bsdasriToManagedWaste,
  BSVHU: bsvhuToManagedWaste,
  BSFF: bsffToManagedWaste
};

const bsdsToAllWastes = {
  BSDD: formToAllWaste,
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
  bsds: RegistryBsdMap
): WasteMap<WasteType> {
  const converter = bsdsToWastes[registryType];
  const { bsdds, bsdas, bsdasris, bsvhus, bsffs } = bsds;

  return {
    BSDD: bsdds.map(form => converter.BSDD(formToBsdd(form))),
    BSDASRI: bsdasris.map(converter.BSDASRI),
    BSVHU: bsvhus.map(converter.BSVHU),
    BSDA: bsdas.map(converter.BSDA),
    BSFF: bsffs.map(converter.BSFF)
  };
}
