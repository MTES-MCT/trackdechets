import {
  BspaohStatus,
  Bspaoh,
  BsdType,
  Prisma,
  OperationMode,
  WasteAcceptationStatus
} from "@prisma/client";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";
import { getTransporterCompanyOrgId } from "@td/constants";
import { buildAddress } from "../companies/sirene/utils";
import { getFirstTransporterSync } from "./converter";
import { prisma } from "@td/prisma";
import { distinct } from "../common/arrays";
import { BspaohIncludes } from "./types";
import { getBspaohSubType } from "../common/subTypes";
import { isDefined } from "../common/helpers";
import { xDaysAgo } from "../utils";

export const BspaohForElasticInclude = {
  ...BspaohIncludes
};

type WhereKeys =
  | "isDraftFor"
  | "isForActionFor"
  | "isFollowFor"
  | "isArchivedFor"
  | "isToCollectFor"
  | "isCollectedFor"
  | "isReturnFor";

// | state              | emitter | transporter | recipient |
// |--------------------|---------|-------------|-----------|
// | draft              | draft   | draft       | draft     |
// | initial            | action  | to collect  | follow    |
// | signed_by_producer | follow  | to collect  | follow    |
// | sent               | follow  | collected   | action    |
// | received           | follow  | follow      | action    |
// | processed          | archive | archive     | archive   |
// | refused            | archive | archive     | archive   |

function getWhere(bspaoh: Bspaoh, transporter): Pick<BsdElastic, WhereKeys> {
  const where: Record<WhereKeys, string[]> = {
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: [],
    isReturnFor: []
  };

  const bsdSirets: Record<string, string | null | undefined> = {
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    destinationCompanySiret: bspaoh.destinationCompanySiret,
    transporterCompanySiret: getTransporterCompanyOrgId(transporter)
  };

  const siretsFilters = new Map<string, keyof typeof where>(
    Object.entries(bsdSirets)
      .filter(([_, siret]) => !!siret)
      .map(([actor, _]) => [actor, "isFollowFor"])
  );

  type Mapping = Map<string, keyof typeof where>;
  const setTab = (map: Mapping, key: string, newValue: keyof typeof where) => {
    if (!map.has(key)) {
      return;
    }

    map.set(key, newValue);
  };
  switch (bspaoh.status) {
    case BspaohStatus.DRAFT: {
      for (const fieldName of siretsFilters.keys()) {
        setTab(siretsFilters, fieldName, "isDraftFor");
      }
      break;
    }
    case BspaohStatus.INITIAL: {
      setTab(siretsFilters, "emitterCompanySiret", "isForActionFor");

      break;
    }

    case BspaohStatus.SIGNED_BY_PRODUCER: {
      setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
      break;
    }

    case BspaohStatus.SENT: {
      setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
      setTab(siretsFilters, "transporterCompanySiret", "isCollectedFor");
      break;
    }

    case BspaohStatus.RECEIVED: {
      setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
      break;
    }

    case BspaohStatus.REFUSED:
    case BspaohStatus.PROCESSED: {
      for (const fieldName of siretsFilters.keys()) {
        setTab(siretsFilters, fieldName, "isArchivedFor");
      }
      break;
    }
    default:
      break;
  }

  // Return tab
  if (belongsToIsReturnForTab(bspaoh)) {
    setTab(siretsFilters, "transporterCompanySiret", "isReturnFor");
  }

  for (const [fieldName, filter] of siretsFilters.entries()) {
    const filterValue = bsdSirets[fieldName];
    if (fieldName && filterValue) {
      where[filter].push(filterValue);
    }
  }

  // deduplicate sirets
  for (const [tab, sirets] of Object.entries(where)) {
    where[tab] = distinct(sirets);
  }

  return where;
}

export const BspaohWithTransportersInclude =
  Prisma.validator<Prisma.BspaohInclude>()({
    transporters: true
  });
export type BspaohWithTransporters = Prisma.BspaohGetPayload<{
  include: typeof BspaohWithTransportersInclude;
}>;

export type BspaohForElastic = BspaohWithTransporters;

/**
 * Convert a bsd from the bspaoh table to Elastic Search's BSD model.
 */
export function toBsdElastic(bspaoh: BspaohForElastic): BsdElastic {
  const transporters = bspaoh?.transporters ?? [];
  const transporter = getFirstTransporterSync({ transporters });
  const where = getWhere(bspaoh, transporter);

  return {
    type: BsdType.BSPAOH,
    bsdSubType: getBspaohSubType(bspaoh),
    createdAt: bspaoh.createdAt?.getTime(),
    updatedAt: bspaoh.updatedAt?.getTime(),
    id: bspaoh.id,
    readableId: bspaoh.id,
    customId: "",
    status: bspaoh.status,
    wasteCode: bspaoh.wasteCode ?? "",
    wasteAdr: bspaoh.wasteAdr ?? "",
    wasteDescription: "",
    packagingNumbers: [],
    wasteSealNumbers: [],
    identificationNumbers: [],
    ficheInterventionNumbers: [],
    emitterCompanyName: bspaoh.emitterCompanyName ?? "",
    emitterCompanySiret: bspaoh.emitterCompanySiret ?? "",
    emitterCompanyAddress: bspaoh.emitterCompanyAddress ?? "",
    emitterPickupSiteName: bspaoh.emitterPickupSiteName ?? "",
    emitterPickupSiteAddress: buildAddress([
      bspaoh.emitterPickupSiteAddress,
      bspaoh.emitterPickupSitePostalCode,
      bspaoh.emitterPickupSiteCity
    ]),
    emitterCustomInfo: bspaoh.emitterCustomInfo ?? "",
    workerCompanyName: "",
    workerCompanySiret: "",
    workerCompanyAddress: "",

    transporterCompanyName: transporter?.transporterCompanyName ?? "",
    transporterCompanySiret: transporter?.transporterCompanySiret ?? "",
    transporterCompanyVatNumber: transporter?.transporterCompanyVatNumber ?? "",
    transporterCompanyAddress: transporter?.transporterCompanyAddress ?? "",
    transporterCustomInfo: transporter?.transporterCustomInfo ?? "",
    transporterTransportPlates:
      transporter?.transporterTransportPlates.map(transportPlateFilter) ?? [],

    destinationCompanyName: bspaoh.destinationCompanyName ?? "",
    destinationCompanySiret: bspaoh.destinationCompanySiret ?? "",
    destinationCompanyAddress: bspaoh.destinationCompanyAddress ?? "",
    destinationCustomInfo: bspaoh.destinationCustomInfo ?? "",
    destinationCap: "",

    brokerCompanyName: "",
    brokerCompanySiret: "",
    brokerCompanyAddress: "",

    traderCompanyName: "",
    traderCompanySiret: "",
    traderCompanyAddress: "",

    ecoOrganismeName: "",
    ecoOrganismeSiret: "",

    nextDestinationCompanyName: "",
    nextDestinationCompanySiret: "",
    nextDestinationCompanyVatNumber: "",
    nextDestinationCompanyAddress: "",

    destinationOperationCode: bspaoh.destinationOperationCode ?? "",
    destinationOperationMode: OperationMode.ELIMINATION,
    emitterEmissionDate: bspaoh.emitterEmissionSignatureDate?.getTime(),
    workerWorkDate: undefined,
    transporterTransportTakenOverAt:
      bspaoh.transporterTransportTakenOverAt?.getTime(),
    destinationReceptionDate: bspaoh.destinationReceptionDate?.getTime(),
    destinationAcceptationDate: bspaoh.destinationReceptionDate?.getTime(),
    destinationAcceptationWeight:
      bspaoh.destinationReceptionWasteAcceptedWeightValue,
    destinationOperationDate: bspaoh.destinationOperationDate?.getTime(),
    ...where,
    isInRevisionFor: [],
    isRevisedFor: [],
    sirets: distinct(Object.values(where).flat()),
    ...getRegistryFields(bspaoh),
    rawBsd: bspaoh,
    revisionRequests: [],

    // ALL actors from the BSPAOH, for quick search
    companyNames: distinct(
      [
        bspaoh.emitterCompanyName,
        transporter?.transporterCompanyName,
        bspaoh.destinationCompanyName
      ].filter(Boolean)
    ).join("\n"),
    companyOrgIds: distinct(
      [
        bspaoh.emitterCompanySiret,
        transporter?.transporterCompanySiret,
        transporter?.transporterCompanyVatNumber,
        bspaoh.destinationCompanySiret
      ].filter(Boolean)
    )
  };
}

export function indexBspaoh(
  bspaoh: BspaohWithTransporters,
  ctx?: GraphQLContext
) {
  return indexBsd(toBsdElastic(bspaoh), ctx);
}

export async function getBspaohForElastic(
  bspaoh: Pick<Bspaoh, "id">
): Promise<BspaohForElastic> {
  return prisma.bspaoh.findUniqueOrThrow({
    where: { id: bspaoh.id },
    include: { transporters: true }
  });
}

/**
 * BSPAOH belongs to isReturnFor tab if:
 * - waste has been received in the last 48 hours
 * - waste hasn't been fully accepted at reception
 */
export const belongsToIsReturnForTab = (bspaoh: Bspaoh) => {
  const hasBeenReceivedLately =
    isDefined(bspaoh.destinationReceptionDate) &&
    bspaoh.destinationReceptionDate! > xDaysAgo(new Date(), 2);

  if (!hasBeenReceivedLately) return false;

  const hasNotBeenFullyAccepted =
    bspaoh.destinationReceptionAcceptationStatus !==
    WasteAcceptationStatus.ACCEPTED;

  return hasNotBeenFullyAccepted;
};
