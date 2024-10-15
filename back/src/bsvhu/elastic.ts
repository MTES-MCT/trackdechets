import {
  BsvhuStatus,
  Bsvhu,
  BsdType,
  WasteAcceptationStatus
} from "@prisma/client";
import { prisma } from "@td/prisma";
import {
  getIntermediaryCompanyOrgId,
  getTransporterCompanyOrgId
} from "@td/constants";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";
import { getBsvhuSubType } from "../common/subTypes";
import { getAddress } from "./converter";
import {
  BsvhuWithIntermediaries,
  BsvhuWithIntermediariesInclude
} from "./types";
import { isDefined } from "../common/helpers";
import { xDaysAgo } from "../utils";

export const BsvhuForElasticInclude = {
  ...BsvhuWithIntermediariesInclude
};

export async function getBsvhuForElastic(
  bsda: Pick<Bsvhu, "id">
): Promise<BsvhuForElastic> {
  return prisma.bsvhu.findUniqueOrThrow({
    where: { id: bsda.id },
    include: BsvhuForElasticInclude
  });
}

type ElasticSirets = {
  emitterCompanySiret: string | null | undefined;
  ecoOrganismeSiret: string | null | undefined;
  destinationCompanySiret: string | null | undefined;
  transporterCompanySiret: string | null | undefined;
  intermediarySiret1?: string | null | undefined;
  intermediarySiret2?: string | null | undefined;
  intermediarySiret3?: string | null | undefined;
};
const getBsvhuSirets = (bsvhu: BsvhuForElastic): ElasticSirets => {
  const intermediarySirets = bsvhu.intermediaries.reduce(
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

  const bsvhuSirets: ElasticSirets = {
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    ecoOrganismeSiret: bsvhu.ecoOrganismeSiret,
    transporterCompanySiret: getTransporterCompanyOrgId(bsvhu),
    ...intermediarySirets
  };

  return bsvhuSirets;
};

type WhereKeys =
  | "isDraftFor"
  | "isForActionFor"
  | "isFollowFor"
  | "isArchivedFor"
  | "isToCollectFor"
  | "isCollectedFor";

// | state              | emitter | transporter | destination | intermediary |
// |--------------------|---------|-------------|-------------|--------------|
// | initial (draft)    | draft   | draft       | draft       | follow       |
// | initial            | action  | follow      | follow      | follow       |
// | signed_by_producer | follow  | to collect  | follow      | follow       |
// | sent               | follow  | collected   | action      | follow       |
// | processed          | archive | archive     | archive     | archive      |
// | refused            | archive | archive     | archive     | archive      |

export function getWhere(bsvhu: BsvhuForElastic): Pick<BsdElastic, WhereKeys> {
  const where: Record<WhereKeys, string[]> = {
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: []
  };

  const formSirets = getBsvhuSirets(bsvhu);

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

  switch (bsvhu.status) {
    case BsvhuStatus.INITIAL: {
      if (bsvhu.isDraft) {
        for (const fieldName of siretsFilters.keys()) {
          setTab(siretsFilters, fieldName, "isDraftFor");
        }
      } else {
        setTab(siretsFilters, "emitterCompanySiret", "isForActionFor");
        setTab(siretsFilters, "transporterCompanySiret", "isFollowFor");
      }
      break;
    }

    case BsvhuStatus.SIGNED_BY_PRODUCER: {
      setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
      break;
    }

    case BsvhuStatus.SENT: {
      setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
      setTab(siretsFilters, "transporterCompanySiret", "isCollectedFor");
      break;
    }

    case BsvhuStatus.REFUSED:
    case BsvhuStatus.PROCESSED: {
      for (const fieldName of siretsFilters.keys()) {
        setTab(siretsFilters, fieldName, "isArchivedFor");
      }
      break;
    }
    default:
      break;
  }

  for (const [fieldName, filter] of siretsFilters.entries()) {
    if (fieldName) {
      where[filter].push(formSirets[fieldName]);
    }
  }

  return where;
}

export type BsvhuForElastic = Bsvhu & BsvhuWithIntermediaries;

/**
 * Convert a bsvhu from the bsvhu table to Elastic Search's BSD model.
 */
export function toBsdElastic(bsvhu: BsvhuForElastic): BsdElastic {
  const where = getWhere(bsvhu);

  return {
    type: BsdType.BSVHU,
    bsdSubType: getBsvhuSubType(bsvhu),
    createdAt: bsvhu.createdAt?.getTime(),
    updatedAt: bsvhu.updatedAt?.getTime(),
    id: bsvhu.id,
    readableId: bsvhu.id,
    customId: "",
    status: bsvhu.status,
    wasteCode: bsvhu.wasteCode ?? "",
    wasteAdr: "",
    wasteDescription: "",
    packagingNumbers: [],
    wasteSealNumbers: [],
    identificationNumbers: bsvhu.identificationNumbers ?? [],
    ficheInterventionNumbers: [],
    emitterCompanyName: bsvhu.emitterCompanyName ?? "",
    emitterCompanySiret: bsvhu.emitterCompanySiret ?? "",
    emitterCompanyAddress:
      getAddress({
        address: bsvhu.emitterCompanyAddress,
        street: bsvhu.emitterCompanyStreet,
        city: bsvhu.emitterCompanyCity,
        postalCode: bsvhu.emitterCompanyPostalCode
      }) ?? "",
    emitterPickupSiteName: "",
    emitterPickupSiteAddress: "",
    emitterCustomInfo: bsvhu.emitterCustomInfo ?? "",
    workerCompanyName: "",
    workerCompanySiret: "",
    workerCompanyAddress: "",

    transporterCompanyName: bsvhu.transporterCompanyName ?? "",
    transporterCompanySiret: bsvhu.transporterCompanySiret ?? "",
    transporterCompanyVatNumber: bsvhu.transporterCompanyVatNumber ?? "",
    transporterCompanyAddress: bsvhu.transporterCompanyAddress ?? "",
    transporterCustomInfo: bsvhu.transporterCustomInfo ?? "",
    transporterTransportPlates:
      bsvhu.transporterTransportPlates.map(transportPlateFilter) ?? [],

    destinationCompanyName: bsvhu.destinationCompanyName ?? "",
    destinationCompanySiret: bsvhu.destinationCompanySiret ?? "",
    destinationCompanyAddress: bsvhu.destinationCompanyAddress ?? "",
    destinationCustomInfo: "",
    destinationCap: "",

    brokerCompanyName: "",
    brokerCompanySiret: "",
    brokerCompanyAddress: "",

    traderCompanyName: "",
    traderCompanySiret: "",
    traderCompanyAddress: "",

    ecoOrganismeName: bsvhu.ecoOrganismeName ?? "",
    ecoOrganismeSiret: bsvhu.ecoOrganismeSiret ?? "",

    nextDestinationCompanyName:
      bsvhu.destinationOperationNextDestinationCompanyName ?? "",
    nextDestinationCompanySiret:
      bsvhu.destinationOperationNextDestinationCompanySiret ?? "",
    nextDestinationCompanyVatNumber:
      bsvhu.destinationOperationNextDestinationCompanyVatNumber ?? "",
    nextDestinationCompanyAddress:
      bsvhu.destinationOperationNextDestinationCompanyAddress ?? "",

    destinationOperationCode: bsvhu.destinationOperationCode ?? "",
    destinationOperationMode: bsvhu.destinationOperationMode ?? undefined,

    emitterEmissionDate: bsvhu.emitterEmissionSignatureDate?.getTime(),
    workerWorkDate: undefined,
    transporterTransportTakenOverAt:
      bsvhu.transporterTransportTakenOverAt?.getTime(),
    destinationReceptionDate: bsvhu.destinationReceptionDate?.getTime(),
    destinationAcceptationDate: bsvhu.destinationReceptionDate?.getTime(),
    destinationAcceptationWeight: bsvhu.destinationReceptionWeight,
    destinationOperationDate: bsvhu.destinationOperationDate?.getTime(),
    ...where,
    isInRevisionFor: [],
    isRevisedFor: [],
    ...getBsvhuReturnOrgIds(bsvhu),
    sirets: Object.values(where).flat(),
    ...getRegistryFields(bsvhu),
    rawBsd: bsvhu,
    revisionRequests: [],
    intermediaries: bsvhu.intermediaries,

    // ALL actors from the BSVHU, for quick search
    companyNames: [
      bsvhu.emitterCompanyName,
      bsvhu.transporterCompanyName,
      bsvhu.destinationCompanyName,
      bsvhu.ecoOrganismeName,
      ...bsvhu.intermediaries.map(intermediary => intermediary.name)
    ]
      .filter(Boolean)
      .join(" "),
    companyOrgIds: [
      bsvhu.emitterCompanySiret,
      bsvhu.transporterCompanySiret,
      bsvhu.transporterCompanyVatNumber,
      bsvhu.destinationCompanySiret,
      bsvhu.ecoOrganismeSiret,
      ...bsvhu.intermediaries.map(intermediary => intermediary.siret),
      ...bsvhu.intermediaries.map(intermediary => intermediary.vatNumber)
    ].filter(Boolean)
  };
}

export function indexBsvhu(bsvhu: BsvhuForElastic, ctx?: GraphQLContext) {
  return indexBsd(toBsdElastic(bsvhu), ctx);
}

/**
 * BSVHU belongs to isReturnFor tab if:
 * - waste has been received in the last 48 hours
 * - waste hasn't been fully accepted at reception
 */
export const belongsToIsReturnForTab = (bsvhu: BsvhuForElastic) => {
  const hasBeenReceivedLately =
    isDefined(bsvhu.destinationReceptionDate) &&
    bsvhu.destinationReceptionDate! > xDaysAgo(new Date(), 2);

  if (!hasBeenReceivedLately) return false;

  const hasNotBeenFullyAccepted =
    bsvhu.status === BsvhuStatus.REFUSED ||
    bsvhu.destinationReceptionAcceptationStatus !==
      WasteAcceptationStatus.ACCEPTED;

  return hasNotBeenFullyAccepted;
};

function getBsvhuReturnOrgIds(bsvhu: BsvhuForElastic): {
  isReturnFor: string[];
} {
  // Return tab
  if (belongsToIsReturnForTab(bsvhu)) {
    return {
      isReturnFor: [bsvhu.transporterCompanySiret].filter(Boolean)
    };
  }

  return { isReturnFor: [] };
}
