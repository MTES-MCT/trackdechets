import { BsvhuStatus, Bsvhu, BsdType } from "@prisma/client";
import { getTransporterCompanyOrgId } from "shared/constants";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";

type WhereKeys =
  | "isDraftFor"
  | "isForActionFor"
  | "isFollowFor"
  | "isArchivedFor"
  | "isToCollectFor"
  | "isCollectedFor";

// | state              | emitter | transporter | destination |
// |--------------------|---------|-------------|-------------|
// | initial (draft)    | draft   | draft       | draft       |
// | initial            | action  | follow      | follow      |
// | signed_by_producer | follow  | to collect  | follow      |
// | sent               | follow  | collected   | action      |
// | processed          | archive | archive     | archive     |
// | refused            | archive | archive     | archive     |

export function getWhere(bsvhu: Bsvhu): Pick<BsdElastic, WhereKeys> {
  const where: Record<WhereKeys, string[]> = {
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: []
  };

  const formSirets: Partial<Record<keyof Bsvhu, string | null | undefined>> = {
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    transporterCompanySiret: getTransporterCompanyOrgId(bsvhu)
  };

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

export type BsvhuForElastic = Bsvhu;

/**
 * Convert a bsvhu from the bsvhu table to Elastic Search's BSD model.
 */
export function toBsdElastic(bsvhu: BsvhuForElastic): BsdElastic {
  const where = getWhere(bsvhu);

  return {
    type: BsdType.BSVHU,
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
    emitterCompanyAddress: bsvhu.emitterCompanyAddress ?? "",
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

    ecoOrganismeName: "",
    ecoOrganismeSiret: "",

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
    latestRevisionCreatedAt: undefined,
    sirets: Object.values(where).flat(),
    ...getRegistryFields(bsvhu),
    rawBsd: bsvhu
  };
}

export function indexBsvhu(bsvhu: Bsvhu, ctx?: GraphQLContext) {
  return indexBsd(toBsdElastic(bsvhu), ctx);
}
