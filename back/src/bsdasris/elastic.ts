import { BsdasriStatus, Bsdasri, BsdasriType, BsdType } from "@prisma/client";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";
import { getTransporterCompanyOrgId } from "shared/constants";
import { buildAddress } from "../companies/sirene/utils";
import {
  BsdasriWithGrouping,
  BsdasriWithSynthesizing,
  BsdasriWithGroupingInclude,
  BsdasriWithSynthesizingInclude
} from "./types";
import prisma from "../prisma";

export type BsdasriForElastic = Bsdasri &
  BsdasriWithGrouping &
  BsdasriWithSynthesizing;

export const BsdasriForElasticInclude = {
  ...BsdasriWithGroupingInclude,
  ...BsdasriWithSynthesizingInclude
};

export async function getBsdasriForElastic(
  bsdasri: Pick<Bsdasri, "id">
): Promise<BsdasriForElastic> {
  return prisma.bsdasri.findUniqueOrThrow({
    where: { id: bsdasri.id },
    include: BsdasriForElasticInclude
  });
}

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

function getWhere(bsdasri: Bsdasri): Pick<BsdElastic, WhereKeys> {
  const where: Record<WhereKeys, string[]> = {
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: []
  };

  const formSirets: Record<string, string | null | undefined> = {
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    transporterCompanySiret: getTransporterCompanyOrgId(bsdasri),
    ecoOrganismeSiret: bsdasri.ecoOrganismeSiret
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
    destinationCap: "",

    brokerCompanyName: "",
    brokerCompanySiret: "",
    brokerCompanyAddress: "",

    traderCompanyName: "",
    traderCompanySiret: "",
    traderCompanyAddress: "",

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
    destinationAcceptationWeight: bsdasri.destinationReceptionWasteWeightValue,
    destinationOperationDate: bsdasri.destinationOperationDate?.getTime(),
    ...where,
    isInRevisionFor: [],
    isRevisedFor: [],
    sirets: Object.values(where).flat(),
    ...getRegistryFields(bsdasri),
    rawBsd: bsdasri,

    // ALL actors from the BSDASRI, for quick search
    companiesNames: [
      bsdasri.emitterCompanyName,
      bsdasri.ecoOrganismeName,
      bsdasri.transporterCompanyName,
      bsdasri.destinationCompanyName
    ]
      .filter(Boolean)
      .join("\n"),
    companiesSirets: [
      bsdasri.emitterCompanySiret,
      bsdasri.ecoOrganismeSiret,
      bsdasri.transporterCompanySiret,
      bsdasri.destinationCompanySiret
    ].filter(Boolean)
  };
}

export function indexBsdasri(bsdasri: BsdasriForElastic, ctx?: GraphQLContext) {
  return indexBsd(toBsdElastic(bsdasri), ctx);
}
