import {
  BsdasriStatus,
  Bsdasri,
  BsdasriType,
  BsdType,
  WasteAcceptationStatus
} from "@prisma/client";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";
import { getElasticExhaustiveRegistryFields } from "./registryV2";
import {
  getIntermediaryCompanyOrgId,
  getTransporterCompanyOrgId
} from "@td/constants";
import { buildAddress } from "../companies/sirene/utils";
import {
  BsdasriWithGrouping,
  BsdasriWithSynthesizing,
  BsdasriWithGroupingInclude,
  BsdasriWithSynthesizingInclude,
  BsdasriWithRevisionRequests,
  BsdasriWithRevisionRequestsInclude,
  BsdasriWithIntermediaries,
  BsdasriWithIntermediariesInclude
} from "./types";
import { prisma } from "@td/prisma";
import {
  getNonPendingLatestRevisionRequestUpdatedAt,
  getRevisionOrgIds,
  RevisionTab
} from "../common/elasticHelpers";
import { getBsdasriSubType } from "../common/subTypes";
import { isDefined } from "../common/helpers";
import { xDaysAgo } from "../utils";

export type BsdasriForElastic = Bsdasri &
  BsdasriWithGrouping &
  BsdasriWithSynthesizing &
  BsdasriWithIntermediaries &
  BsdasriWithRevisionRequests;

export const BsdasriForElasticInclude = {
  ...BsdasriWithGroupingInclude,
  ...BsdasriWithSynthesizingInclude,
  ...BsdasriWithRevisionRequestsInclude,
  ...BsdasriWithIntermediariesInclude
};

export async function getBsdasriForElastic(
  bsdasri: Pick<Bsdasri, "id">
): Promise<BsdasriForElastic> {
  return prisma.bsdasri.findUniqueOrThrow({
    where: { id: bsdasri.id },
    include: BsdasriForElasticInclude
  });
}

type ElasticSirets = {
  emitterCompanySiret: string | null | undefined;
  ecoOrganismeSiret: string | null | undefined;
  destinationCompanySiret: string | null | undefined;
  transporterCompanySiret: string | null | undefined;
  brokerCompanySiret: string | null | undefined;
  traderCompanySiret: string | null | undefined;
  intermediarySiret1?: string | null | undefined;
  intermediarySiret2?: string | null | undefined;
  intermediarySiret3?: string | null | undefined;
};

const getBsdasriSirets = (bsdasri: BsdasriForElastic): ElasticSirets => {
  const intermediarySirets = bsdasri.intermediaries.reduce(
    (sirets, intermediary) => {
      const orgId = getIntermediaryCompanyOrgId(intermediary);
      if (orgId) {
        const nbOfKeys = Object.keys(sirets).length;
        return {
          ...sirets,
          [`intermediarySiret${nbOfKeys + 1}`]: orgId
        };
      }
      return sirets;
    },
    {}
  );
  const bsdasriSirets: ElasticSirets = {
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    transporterCompanySiret: getTransporterCompanyOrgId(bsdasri),
    ecoOrganismeSiret: bsdasri.ecoOrganismeSiret,
    brokerCompanySiret: bsdasri.brokerCompanySiret,
    traderCompanySiret: bsdasri.traderCompanySiret,

    ...intermediarySirets
  };

  // Drafts only appear in the dashboard for companies the bsdasri owner belongs to
  if (bsdasri.isDraft) {
    const draftFormSiretsEntries = Object.entries(bsdasriSirets).filter(
      ([, siret]) => siret && bsdasri.canAccessDraftOrgIds.includes(siret)
    );
    return Object.fromEntries(draftFormSiretsEntries) as ElasticSirets;
  }

  return bsdasriSirets;
};

type WhereKeys =
  | "isDraftFor"
  | "isForActionFor"
  | "isFollowFor"
  | "isArchivedFor"
  | "isToCollectFor"
  | "isCollectedFor";

// | state              | emitter | transporter | recipient |
// |--------------------|---------|-------------|-----------|
// | initial (draft)    | draft   | draft       | draft     |
// | initial            | action  | to collect  | follow    |
// | initial(synthesis) | follow  | to collect  | follow    |
// | signed_by_producer | follow  | to collect  | follow    |
// | sent               | follow  | collected   | action    |
// | received           | follow  | follow      | action    |
// | processed          | archive | archive     | archive   |
// | refused            | archive | archive     | archive   |
// | awaiting_group     | follow  | follow      | follow    |

function getWhere(bsdasri: BsdasriForElastic): Pick<BsdElastic, WhereKeys> {
  const where: Record<WhereKeys, string[]> = {
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: []
  };

  const formSirets = getBsdasriSirets(bsdasri);

  const siretsFilters = new Map<string, keyof typeof where>(
    Object.entries(formSirets)
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
  switch (bsdasri.status) {
    case BsdasriStatus.INITIAL: {
      if (bsdasri.isDraft) {
        for (const fieldName of siretsFilters.keys()) {
          setTab(siretsFilters, fieldName, "isDraftFor");
        }
      } else {
        if (bsdasri.type !== BsdasriType.SYNTHESIS) {
          // for Synthesis dasri emitter & transporter are the same company, INITIAL bsd should appear in `isToCollectFor` tab
          setTab(siretsFilters, "emitterCompanySiret", "isForActionFor");
          setTab(siretsFilters, "ecoOrganismeSiret", "isForActionFor");
        }

        setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
      }
      break;
    }

    case BsdasriStatus.SIGNED_BY_PRODUCER: {
      setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
      break;
    }

    case BsdasriStatus.SENT: {
      setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
      setTab(siretsFilters, "transporterCompanySiret", "isCollectedFor");
      break;
    }

    case BsdasriStatus.RECEIVED: {
      setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
      break;
    }

    case BsdasriStatus.REFUSED:
    case BsdasriStatus.CANCELED:
    case BsdasriStatus.PROCESSED: {
      for (const fieldName of siretsFilters.keys()) {
        setTab(siretsFilters, fieldName, "isArchivedFor");
      }
      break;
    }

    default:
      break;
  }

  for (const [fieldName, filter] of siretsFilters.entries()) {
    const filterValue = formSirets[fieldName];
    if (fieldName && filterValue) {
      where[filter].push(filterValue);
    }
  }

  return where;
}

/**
 * Convert a dasri from the bsdasri table to Elastic Search's BSD model.
 */
export function toBsdElastic(bsdasri: BsdasriForElastic): BsdElastic {
  const where = getWhere(bsdasri);

  return {
    type: BsdType.BSDASRI,
    bsdSubType: getBsdasriSubType(bsdasri),
    createdAt: bsdasri.createdAt?.getTime(),
    updatedAt: bsdasri.updatedAt?.getTime(),
    id: bsdasri.id,
    readableId: bsdasri.id,
    customId: "",
    status: bsdasri.status,
    wasteCode: bsdasri.wasteCode ?? "",
    wasteAdr: bsdasri.wasteAdr ?? "",
    wasteDescription: "",
    packagingNumbers: [],
    wasteSealNumbers: [],
    identificationNumbers: bsdasri.identificationNumbers ?? [],
    ficheInterventionNumbers: [],
    emitterCompanyName: bsdasri.emitterCompanyName ?? "",
    emitterCompanySiret: bsdasri.emitterCompanySiret ?? "",
    emitterCompanyAddress: bsdasri.emitterCompanyAddress ?? "",
    emitterPickupSiteName: bsdasri.emitterPickupSiteName ?? "",
    emitterPickupSiteAddress: buildAddress([
      bsdasri.emitterPickupSiteAddress,
      bsdasri.emitterPickupSitePostalCode,
      bsdasri.emitterPickupSiteCity
    ]),
    emitterCustomInfo: bsdasri.emitterCustomInfo ?? "",
    workerCompanyName: "",
    workerCompanySiret: "",
    workerCompanyAddress: "",

    transporterCompanyName: bsdasri.transporterCompanyName ?? "",
    transporterCompanySiret: bsdasri.transporterCompanySiret ?? "",
    transporterCompanyVatNumber: bsdasri.transporterCompanyVatNumber ?? "",
    transporterCompanyAddress: bsdasri.transporterCompanyAddress ?? "",
    transporterCustomInfo: bsdasri.transporterCustomInfo ?? "",
    transporterTransportPlates:
      bsdasri.transporterTransportPlates.map(transportPlateFilter) ?? [],

    destinationCompanyName: bsdasri.destinationCompanyName ?? "",
    destinationCompanySiret: bsdasri.destinationCompanySiret ?? "",
    destinationCompanyAddress: bsdasri.destinationCompanyAddress ?? "",
    destinationCustomInfo: bsdasri.destinationCustomInfo ?? "",
    destinationCap: bsdasri.destinationCap ?? "",

    brokerCompanyName: bsdasri.brokerCompanyName ?? "",
    brokerCompanySiret: bsdasri.brokerCompanySiret ?? "",
    brokerCompanyAddress: bsdasri.brokerCompanyAddress ?? "",

    traderCompanyName: bsdasri.traderCompanyName ?? "",
    traderCompanySiret: bsdasri.traderCompanySiret ?? "",
    traderCompanyAddress: bsdasri.traderCompanyAddress ?? "",

    ecoOrganismeName: bsdasri.ecoOrganismeName ?? "",
    ecoOrganismeSiret: bsdasri.ecoOrganismeSiret ?? "",

    nextDestinationCompanyName: "",
    nextDestinationCompanySiret: "",
    nextDestinationCompanyVatNumber: "",
    nextDestinationCompanyAddress: "",

    destinationOperationCode: bsdasri.destinationOperationCode ?? "",
    destinationOperationMode: bsdasri?.destinationOperationMode ?? undefined,

    emitterEmissionDate: bsdasri.emitterEmissionSignatureDate?.getTime(),
    workerWorkDate: undefined,
    transporterTransportTakenOverAt: bsdasri.transporterTakenOverAt?.getTime(),
    destinationReceptionDate: bsdasri.destinationReceptionDate?.getTime(),
    destinationAcceptationDate: bsdasri.destinationReceptionDate?.getTime(),
    destinationAcceptationWeight: bsdasri.destinationReceptionWasteWeightValue
      ? bsdasri.destinationReceptionWasteWeightValue.toNumber()
      : null,
    destinationOperationDate: bsdasri.destinationOperationDate?.getTime(),
    ...where,

    ...getBsdasriRevisionOrgIds(bsdasri),
    ...getBsdasriReturnOrgIds(bsdasri),
    revisionRequests: bsdasri.bsdasriRevisionRequests,
    nonPendingLatestRevisionRequestUpdatedAt:
      getNonPendingLatestRevisionRequestUpdatedAt(
        bsdasri.bsdasriRevisionRequests
      ),

    sirets: Object.values(where).flat(),
    ...getRegistryFields(bsdasri),
    ...getElasticExhaustiveRegistryFields(bsdasri),
    rawBsd: bsdasri,

    // ALL actors from the BSDASRI, for quick search
    companyNames: [
      bsdasri.emitterCompanyName,
      bsdasri.ecoOrganismeName,
      bsdasri.transporterCompanyName,
      bsdasri.destinationCompanyName,
      bsdasri.brokerCompanyName,
      bsdasri.traderCompanyName,
      ...bsdasri.intermediaries.map(intermediary => intermediary.name)
    ]
      .filter(Boolean)
      .join(" "),
    companyOrgIds: [
      bsdasri.emitterCompanySiret,
      bsdasri.ecoOrganismeSiret,
      bsdasri.transporterCompanySiret,
      bsdasri.transporterCompanyVatNumber,
      bsdasri.destinationCompanySiret,
      bsdasri.brokerCompanySiret,
      bsdasri.traderCompanySiret,
      ...bsdasri.intermediaries.map(intermediary => intermediary.siret),
      ...bsdasri.intermediaries.map(intermediary => intermediary.vatNumber)
    ].filter(Boolean)
  };
}

export function indexBsdasri(
  bsdasri: BsdasriForElastic,
  ctx?: {
    gqlCtx?: GraphQLContext;
    optimisticCtx?: { seqNo: number; primaryTerm: number };
  }
) {
  return indexBsd(toBsdElastic(bsdasri), ctx);
}
/**
 * Pour un Dasri donné, retourne l'ensemble des identifiants d'établissements
 * pour lesquels il y a une demande de révision en cours ou passée.
 */
export function getBsdasriRevisionOrgIds(
  bsdasri: BsdasriForElastic
): Pick<BsdElastic, RevisionTab> {
  return getRevisionOrgIds(bsdasri.bsdasriRevisionRequests);
}

/**
 * BSDASRI belongs to isReturnFor tab if:
 * - waste has been received in the last 48 hours
 * - waste hasn't been fully accepted at reception
 */
export const belongsToIsReturnForTab = (bsdasri: Bsdasri) => {
  const hasBeenReceivedLately =
    isDefined(bsdasri.destinationReceptionDate) &&
    bsdasri.destinationReceptionDate! > xDaysAgo(new Date(), 2);

  if (!hasBeenReceivedLately) return false;

  const hasNotBeenFullyAccepted =
    bsdasri.status === BsdasriStatus.REFUSED ||
    bsdasri.destinationReceptionAcceptationStatus !==
      WasteAcceptationStatus.ACCEPTED;

  return hasNotBeenFullyAccepted;
};

function getBsdasriReturnOrgIds(bsdasri: Bsdasri): { isReturnFor: string[] } {
  // Return tab
  if (belongsToIsReturnForTab(bsdasri)) {
    return {
      isReturnFor: [bsdasri.transporterCompanySiret].filter(Boolean)
    };
  }

  return { isReturnFor: [] };
}
