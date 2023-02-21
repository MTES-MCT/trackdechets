import { BsvhuStatus, Bsvhu, BsdType } from "@prisma/client";
import { getTransporterCompanyOrgId } from "../common/constants/companySearchHelpers";
import { BsdElastic, indexBsd } from "../common/elastic";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";

// | state              | emitter | transporter | destination |
// |--------------------|---------|-------------|-------------|
// | initial (draft)    | draft   | draft       | draft       |
// | initial            | action  | to collect  | follow      |
// | signed_by_producer | follow  | to collect  | follow      |
// | sent               | follow  | collected   | action      |
// | processed          | archive | archive     | archive     |
// | refused            | archive | archive     | archive     |

function getWhere(
  bsvhu: Bsvhu
): Pick<
  BsdElastic,
  | "isDraftFor"
  | "isForActionFor"
  | "isFollowFor"
  | "isArchivedFor"
  | "isToCollectFor"
  | "isCollectedFor"
> {
  const where = {
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: []
  };

  const formSirets: Record<string, string | null | undefined> = {
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
        setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
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

/**
 * Convert a bsvhu from the bsvhu table to Elastic Search's BSD model.
 */
export function toBsdElastic(bsvhu: Bsvhu): BsdElastic {
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
    transporterTransportPlates: bsvhu.transporterTransportPlates ?? [],

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

    emitterEmissionDate: bsvhu.emitterEmissionSignatureDate?.getTime(),
    workerWorkDate: null,
    transporterTransportTakenOverAt:
      bsvhu.transporterTransportTakenOverAt?.getTime(),
    destinationReceptionDate: bsvhu.destinationReceptionDate?.getTime(),
    destinationAcceptationDate: bsvhu.destinationReceptionDate?.getTime(),
    destinationAcceptationWeight: bsvhu.destinationReceptionWeight,
    destinationOperationDate: bsvhu.destinationOperationDate?.getTime(),
    ...where,
    sirets: Object.values(where).flat(),
    ...getRegistryFields(bsvhu),
    rawBsd: bsvhu
  };
}

export function indexBsvhu(bsvhu: Bsvhu, ctx?: GraphQLContext) {
  return indexBsd(toBsdElastic(bsvhu), ctx);
}
