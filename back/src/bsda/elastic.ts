import { Bsda, BsdaStatus, BsdType } from "@prisma/client";
import { getTransporterCompanyOrgId } from "@td/constants";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import { buildAddress } from "../companies/sirene/utils";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";
import {
  BsdaWithForwardedIn,
  BsdaWithForwardedInInclude,
  BsdaWithGroupedIn,
  BsdaWithGroupedInInclude,
  BsdaWithIntermediaries,
  BsdaWithIntermediariesInclude,
  BsdaWithRevisionRequests,
  BsdaWithRevisionRequestsInclude,
  BsdaWithTransporters,
  BsdaWithTransportersInclude
} from "./types";
import { prisma } from "@td/prisma";
import { getRevisionOrgIds } from "../common/elasticHelpers";
import { getFirstTransporterSync } from "./database";

export type BsdaForElastic = Bsda &
  BsdaWithTransporters &
  BsdaWithIntermediaries &
  BsdaWithForwardedIn &
  BsdaWithGroupedIn &
  BsdaWithRevisionRequests;

export const BsdaForElasticInclude = {
  ...BsdaWithTransportersInclude,
  ...BsdaWithIntermediariesInclude,
  ...BsdaWithForwardedInInclude,
  ...BsdaWithGroupedInInclude,
  ...BsdaWithRevisionRequestsInclude
};

export async function getBsdaForElastic(
  bsda: Pick<Bsda, "id">
): Promise<BsdaForElastic> {
  return prisma.bsda.findUniqueOrThrow({
    where: { id: bsda.id },
    include: BsdaForElasticInclude
  });
}

type WhereKeys =
  | "isDraftFor"
  | "isForActionFor"
  | "isFollowFor"
  | "isArchivedFor"
  | "isToCollectFor"
  | "isCollectedFor";
// | state              | emitter         | worker          | transporter | destination     | nextDestination | intermediary |
// | ------------------ | --------------- | --------------- | ----------- | --------------- | --------------- | ------------ |
// | INITIAL (draft)    | draft           | draft           | draft       | draft           | follow          | follow       |
// | INITIAL            | action / follow | follow / action | follow      | follow / action | follow          | follow       |
// | SIGNED_BY_PRODUCER | follow          | action          | follow      | follow          | follow          | follow       |
// | SIGNED_BY_WORKER   | follow          | follow          | to collect  | follow          | follow          | follow       |
// | SENT               | follow          | follow          | collected   | action          | follow          | follow       |
// | PROCESSED          | archive         | archive         | archive     | archive         | follow          | archive      |
// | REFUSED            | archive         | archive         | archive     | archive         | follow          | archive      |
// | AWAITING_CHILD     | follow          | follow          | follow      | follow          | follow          | follow       |
function getWhere(bsda: BsdaForElastic): Pick<BsdElastic, WhereKeys> {
  const where: Record<WhereKeys, string[]> = {
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: []
  };

  const intermediarySirets = bsda.intermediaries.reduce(
    (sirets, intermediary) => {
      if (intermediary.siret) {
        const nbOfKeys = Object.keys(sirets).length;
        return {
          ...sirets,
          [`intermediarySiret${nbOfKeys + 1}`]: intermediary.siret
        };
      }
      return sirets;
    },
    {}
  );

  const transporter = getFirstTransporterSync(bsda);

  const bsdaSirets: Partial<
    Record<keyof Bsda | "transporterCompanySiret", string | null | undefined>
  > = {
    emitterCompanySiret: bsda.emitterCompanySiret,
    workerCompanySiret: bsda.workerCompanySiret,
    destinationCompanySiret: bsda.destinationCompanySiret,
    transporterCompanySiret: getTransporterCompanyOrgId(transporter),
    brokerCompanySiret: bsda.brokerCompanySiret,
    destinationOperationNextDestinationCompanySiret:
      bsda.destinationOperationNextDestinationCompanySiret,
    ...intermediarySirets
  };

  const siretsFilters = new Map<string, keyof typeof where>(
    Object.entries(bsdaSirets)
      .filter(([_, siret]) => Boolean(siret))
      .map(([actor, _]) => [actor, "isFollowFor"])
  );
  type Mapping = Map<string, keyof typeof where>;
  const setTab = (map: Mapping, key: string, newValue: keyof typeof where) => {
    if (!map.has(key)) {
      return;
    }

    map.set(key, newValue);
  };

  switch (bsda.status) {
    case BsdaStatus.INITIAL:
      if (bsda.isDraft) {
        for (const fieldName of siretsFilters.keys()) {
          setTab(siretsFilters, fieldName, "isDraftFor");
        }
        break;
      }
      if (bsda.type === "COLLECTION_2710") {
        setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
        break;
      }
      if (bsda.emitterIsPrivateIndividual && bsda.workerIsDisabled) {
        setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
        break;
      }
      if (
        bsda.workerWorkHasEmitterPaperSignature ||
        bsda.emitterIsPrivateIndividual
      ) {
        setTab(siretsFilters, "workerCompanySiret", "isForActionFor");
        break;
      }
      setTab(siretsFilters, "emitterCompanySiret", "isForActionFor");
      break;

    case BsdaStatus.SIGNED_BY_PRODUCER:
      if (bsda.type === "OTHER_COLLECTIONS" && !bsda.workerIsDisabled) {
        setTab(siretsFilters, "workerCompanySiret", "isForActionFor");
      } else {
        // Bsda types GATHERING and RESHIPMENT do not expect worker signature,
        // so they're ready to take over an must appear on transporter dashboard
        // (COLLECTION_2710 is directly PROCESSED and never SIGNED_BY_PRODUCER)
        setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
      }

      break;

    case BsdaStatus.SIGNED_BY_WORKER:
      setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
      break;

    case BsdaStatus.SENT:
      setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
      setTab(siretsFilters, "transporterCompanySiret", "isCollectedFor");
      break;

    case BsdaStatus.REFUSED:
    case BsdaStatus.PROCESSED:
    case BsdaStatus.CANCELED:
      for (const fieldName of siretsFilters.keys()) {
        setTab(siretsFilters, fieldName, "isArchivedFor");
      }
      break;

    case BsdaStatus.AWAITING_CHILD:
    default:
      break;
  }

  for (const [fieldName, filter] of siretsFilters.entries()) {
    if (fieldName) {
      where[filter].push(bsdaSirets[fieldName]);
    }
  }

  return where;
}

export function toBsdElastic(bsda: BsdaForElastic): BsdElastic {
  const where = getWhere(bsda);

  const transporter = getFirstTransporterSync(bsda);

  return {
    type: BsdType.BSDA,
    createdAt: bsda.createdAt?.getTime(),
    updatedAt: bsda.updatedAt?.getTime(),
    id: bsda.id,
    readableId: bsda.id,
    customId: "",
    status: bsda.status,
    wasteCode: bsda.wasteCode ?? "",
    wasteAdr: bsda.wasteAdr ?? "",
    wasteDescription: bsda.wasteMaterialName ?? "",
    packagingNumbers: [],
    wasteSealNumbers: bsda.wasteSealNumbers ?? [],
    identificationNumbers: [],
    ficheInterventionNumbers: [],
    emitterCompanyName: bsda.emitterCompanyName ?? "",
    emitterCompanySiret: bsda.emitterCompanySiret ?? "",
    emitterCompanyAddress: bsda.emitterCompanyAddress ?? "",
    emitterPickupSiteName: bsda.emitterPickupSiteName ?? "",
    emitterPickupSiteAddress: buildAddress(
      [
        bsda.emitterPickupSiteAddress,
        bsda.emitterPickupSitePostalCode,
        bsda.emitterPickupSiteCity
      ].filter(Boolean)
    ),
    emitterCustomInfo: bsda.emitterCustomInfo ?? "",
    workerCompanyName: bsda.workerCompanyName ?? "",
    workerCompanySiret: bsda.workerCompanySiret ?? "",
    workerCompanyAddress: bsda.workerCompanyAddress ?? "",

    transporterCompanyName: transporter?.transporterCompanyName ?? "",
    transporterCompanySiret: transporter?.transporterCompanySiret ?? "",
    transporterCompanyVatNumber: transporter?.transporterCompanyVatNumber ?? "",

    transporterCompanyAddress: transporter?.transporterCompanyAddress ?? "",
    transporterCustomInfo: transporter?.transporterCustomInfo ?? "",
    transporterTransportPlates:
      transporter?.transporterTransportPlates.map(transportPlateFilter) ?? [],

    destinationCompanyName: bsda.destinationCompanyName ?? "",
    destinationCompanySiret: bsda.destinationCompanySiret ?? "",
    destinationCompanyAddress: bsda.destinationCompanyAddress ?? "",
    destinationCustomInfo: "",
    destinationCap: bsda.destinationCap ?? "",

    brokerCompanyName: bsda.brokerCompanyName ?? "",
    brokerCompanySiret: bsda.brokerCompanySiret ?? "",
    brokerCompanyAddress: bsda.brokerCompanyAddress ?? "",

    traderCompanyName: "",
    traderCompanySiret: "",
    traderCompanyAddress: "",

    ecoOrganismeName: bsda.ecoOrganismeName ?? "",
    ecoOrganismeSiret: bsda.ecoOrganismeSiret ?? "",

    nextDestinationCompanyName:
      bsda.destinationOperationNextDestinationCompanyName ?? "",
    nextDestinationCompanySiret:
      bsda.destinationOperationNextDestinationCompanySiret ?? "",
    nextDestinationCompanyVatNumber:
      bsda.destinationOperationNextDestinationCompanyVatNumber ?? "",
    nextDestinationCompanyAddress:
      bsda.destinationOperationNextDestinationCompanyAddress ?? "",

    destinationOperationCode: bsda.destinationOperationCode ?? "",
    destinationOperationMode: bsda?.destinationOperationMode ?? undefined,
    emitterEmissionDate: bsda.emitterEmissionSignatureDate?.getTime(),
    workerWorkDate: bsda.workerWorkSignatureDate?.getTime(),
    transporterTransportTakenOverAt:
      transporter?.transporterTransportTakenOverAt?.getTime() ??
      transporter?.transporterTransportSignatureDate?.getTime(),
    destinationReceptionDate: bsda.destinationReceptionDate?.getTime(),
    destinationAcceptationDate: bsda.destinationReceptionDate?.getTime(),
    destinationAcceptationWeight: bsda.destinationReceptionWeight,
    destinationOperationDate: bsda.destinationOperationDate?.getTime(),
    ...where,
    ...getBsdaRevisionOrgIds(bsda),
    revisionRequests: bsda.bsdaRevisionRequests,
    sirets: Object.values(where).flat(),
    ...getRegistryFields(bsda),
    intermediaries: bsda.intermediaries,
    rawBsd: bsda,

    // ALL actors from the BSDA, for quick search
    companyNames: [
      bsda.emitterCompanyName,
      bsda.workerCompanyName,
      ...bsda.transporters.map(b => b.transporterCompanyName),
      bsda.destinationCompanyName,
      bsda.brokerCompanyName,
      bsda.ecoOrganismeName,
      bsda.destinationOperationNextDestinationCompanyName,
      ...bsda.intermediaries.map(intermediary => intermediary.name)
    ]
      .filter(Boolean)
      .join(" "),
    companyOrgIds: [
      bsda.emitterCompanySiret,
      bsda.workerCompanySiret,
      ...bsda.transporters.flatMap(transporter => [
        transporter.transporterCompanySiret,
        transporter.transporterCompanyVatNumber
      ]),
      bsda.destinationCompanySiret,
      bsda.brokerCompanySiret,
      bsda.ecoOrganismeSiret,
      bsda.destinationOperationNextDestinationCompanySiret,
      ...bsda.intermediaries.map(intermediary => intermediary.siret)
    ].filter(Boolean)
  };
}

export function indexBsda(bsda: BsdaForElastic, ctx?: GraphQLContext) {
  return indexBsd(toBsdElastic(bsda), ctx);
}

/**
 * Pour un BSDD donné, retourne l'ensemble des identifiants d'établissements
 * pour lesquels il y a une demande de révision en cours ou passée.
 */
export function getBsdaRevisionOrgIds(
  bsda: BsdaForElastic
): Pick<BsdElastic, "isInRevisionFor" | "isRevisedFor"> {
  return getRevisionOrgIds(bsda.bsdaRevisionRequests);
}
