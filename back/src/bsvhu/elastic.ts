import {
  BsvhuStatus,
  Bsvhu,
  BsdType,
  BsvhuTransporter,
  WasteAcceptationStatus
} from "@td/prisma";
import { prisma } from "@td/prisma";
import {
  getIntermediaryCompanyOrgId,
  getTransporterCompanyOrgId
} from "@td/constants";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import { GraphQLContext } from "../types";
import { getElasticExhaustiveRegistryFields } from "./registryV2";
import { getBsvhuSubType } from "../common/subTypes";
import { getAddress } from "./converter";
import {
  BsvhuWithIntermediaries,
  BsvhuWithIntermediariesInclude,
  BsvhuWithTransporters,
  BsvhuWithTransportersInclude
} from "./types";
import { isDefined } from "../common/helpers";
import { xDaysAgo } from "../utils";
import {
  getFirstTransporterSync,
  getNextTransporterSync,
  getTransportersSync,
  getLastTransporterSync
} from "./database";

export type BsvhuForElastic = Bsvhu &
  BsvhuWithIntermediaries &
  BsvhuWithTransporters;

export const BsvhuForElasticInclude = {
  ...BsvhuWithIntermediariesInclude,
  ...BsvhuWithTransportersInclude
};

export async function getBsvhuForElastic(
  bsvhu: Pick<Bsvhu, "id">
): Promise<BsvhuForElastic> {
  return prisma.bsvhu.findUniqueOrThrow({
    where: { id: bsvhu.id },
    include: BsvhuForElasticInclude
  });
}

type ElasticSirets = {
  emitterCompanySiret: string | null | undefined;
  ecoOrganismeSiret: string | null | undefined;
  destinationCompanySiret: string | null | undefined;
  brokerCompanySiret: string | null | undefined;
  traderCompanySiret: string | null | undefined;
  intermediarySiret1?: string | null | undefined;
  intermediarySiret2?: string | null | undefined;
  intermediarySiret3?: string | null | undefined;
  transporter1CompanyOrgId?: string | null | undefined;
  transporter2CompanyOrgId?: string | null | undefined;
  transporter3CompanyOrgId?: string | null | undefined;
  transporter4CompanyOrgId?: string | null | undefined;
  transporter5CompanyOrgId?: string | null | undefined;
};

// génère une clé permettant d'identifier les transporteurs de façon
// unique dans un mapping
function transporterCompanyOrgIdKey(transporter: BsvhuTransporter) {
  return `transporter${transporter.number}CompanyOrgId`;
}

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

  // build a mapping that looks like
  // { transporter1CompanyOrgId: "SIRET1", transporter2CompanyOrgId: "SIRET2"}
  const transporterOrgIds = (bsvhu.transporters ?? []).reduce(
    (acc, transporter: BsvhuTransporter) => {
      const orgId = getTransporterCompanyOrgId(transporter);
      if (orgId) {
        return {
          ...acc,
          [transporterCompanyOrgIdKey(transporter)]: orgId
        };
      }
      return acc;
    },
    {}
  );

  const bsvhuSirets: ElasticSirets = {
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    ecoOrganismeSiret: bsvhu.ecoOrganismeSiret,
    brokerCompanySiret: bsvhu.brokerCompanySiret,
    traderCompanySiret: bsvhu.traderCompanySiret,
    ...intermediarySirets,
    ...transporterOrgIds
  };

  // Drafts only appear in the dashboard for companies the bsvhu owner belongs to
  if (bsvhu.isDraft) {
    const draftFormSiretsEntries = Object.entries(bsvhuSirets).filter(
      ([, siret]) => siret && bsvhu.canAccessDraftOrgIds.includes(siret)
    );
    return Object.fromEntries(draftFormSiretsEntries) as ElasticSirets;
  }

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
  const firstTransporter = getFirstTransporterSync(bsvhu);

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
      } else if (bsvhu.emitterNotOnTD) {
        // even though the emitter is not on TD, we still add the SIRET to the index
        // so if the account is created after the BSVHU, it will still appear in the
        // emitter's dashboard.
        setTab(siretsFilters, "emitterCompanySiret", "isForActionFor");
        if (firstTransporter) {
          setTab(
            siretsFilters,
            transporterCompanyOrgIdKey(firstTransporter),
            "isToCollectFor"
          );
        }
      } else if (bsvhu.emitterNoSiret) {
        if (firstTransporter) {
          setTab(
            siretsFilters,
            transporterCompanyOrgIdKey(firstTransporter),
            "isToCollectFor"
          );
        }
      } else {
        setTab(siretsFilters, "emitterCompanySiret", "isForActionFor");
        if (firstTransporter) {
          setTab(
            siretsFilters,
            transporterCompanyOrgIdKey(firstTransporter),
            "isFollowFor"
          );
        }
      }
      break;
    }

    case BsvhuStatus.SIGNED_BY_PRODUCER: {
      if (firstTransporter) {
        setTab(
          siretsFilters,
          transporterCompanyOrgIdKey(firstTransporter),
          "isToCollectFor"
        );
      }
      break;
    }

    case BsvhuStatus.SENT: {
      // setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");

      // ETQ destination, je souhaite avoir la possibilité de signer la réception
      // même si l'ensemble des transporteurs visés dans le bordereau n'ont pas pris en charge le déchet,
      // pouvoir gérer au mieux la réception, et éviter le cas où le bordereau serait bloqué en absence
      // d'un des transporteurs. On fait une exception à la règle dans le cas où l'installation de destination
      // est également le transporteur N+1.

      const nextTransporter = getNextTransporterSync(bsvhu);
      if (
        !nextTransporter ||
        nextTransporter.transporterCompanySiret !==
          bsvhu.destinationCompanySiret
      ) {
        setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
      }

      const transporters = getTransportersSync(bsvhu);

      transporters.forEach((transporter, idx) => {
        if (transporter.transporterTransportSignatureDate) {
          // `handedOver` permet de savoir si le transporteur
          // N+1 a également pris en charge le déchet, si c'est le
          // cas le bordereau ne doit pas apparaitre dans l'onglet "Collecté"
          // du transporteur N
          const handedOver = transporters.find(
            t =>
              t.number > transporter.number &&
              t.transporterTransportSignatureDate
          );

          if (!handedOver) {
            setTab(
              siretsFilters,
              transporterCompanyOrgIdKey(transporter),
              "isCollectedFor"
            );
          }
        } else if (
          // le bordereau est "à collecter" soit par le premier transporteur
          // (géré dans case SIGNED_BY_PRODUCER) soit par le transporteur N+1 dès lors que
          // le transporteur N a signé.
          idx > 0 &&
          bsvhu.transporters[idx - 1].transporterTransportSignatureDate
        ) {
          setTab(
            siretsFilters,
            transporterCompanyOrgIdKey(transporter),
            "isToCollectFor"
          );
        }
      });

      break;
    }

    case BsvhuStatus.RECEIVED: {
      setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
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
export function toBsdElastic(bsvhu: BsvhuForElastic): BsdElastic {
  const where = getWhere(bsvhu);

  const transporter = getFirstTransporterSync(bsvhu);

  return {
    type: BsdType.BSVHU,
    bsdSubType: getBsvhuSubType(bsvhu),
    createdAt: bsvhu.createdAt?.getTime(),
    updatedAt: bsvhu.updatedAt?.getTime(),
    id: bsvhu.id,
    readableId: bsvhu.id,
    customId: bsvhu.customId ?? "",
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

    transporterCompanyName: transporter?.transporterCompanyName ?? "",
    transporterCompanySiret: transporter?.transporterCompanySiret ?? "",
    transporterCompanyVatNumber: transporter?.transporterCompanyVatNumber ?? "",
    transporterCompanyAddress: transporter?.transporterCompanyAddress ?? "",
    transporterCustomInfo: transporter?.transporterCustomInfo ?? "",
    transporterTransportPlates:
      transporter?.transporterTransportPlates.map(transportPlateFilter) ?? [],

    destinationCompanyName: bsvhu.destinationCompanyName ?? "",
    destinationCompanySiret: bsvhu.destinationCompanySiret ?? "",
    destinationCompanyAddress: bsvhu.destinationCompanyAddress ?? "",
    destinationCustomInfo: "",
    destinationCap: "",

    brokerCompanyName: bsvhu.brokerCompanyName ?? "",
    brokerCompanySiret: bsvhu.brokerCompanySiret ?? "",
    brokerCompanyAddress: bsvhu.brokerCompanyAddress ?? "",

    traderCompanyName: bsvhu.traderCompanyName ?? "",
    traderCompanySiret: bsvhu.traderCompanySiret ?? "",
    traderCompanyAddress: bsvhu.traderCompanyAddress ?? "",

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
      transporter?.transporterTransportTakenOverAt?.getTime(),
    destinationReceptionDate: bsvhu.destinationReceptionDate?.getTime(),
    destinationAcceptationDate: bsvhu.destinationReceptionDate?.getTime(),
    destinationAcceptationWeight: bsvhu.destinationReceptionWeight,
    destinationOperationDate: bsvhu.destinationOperationDate?.getTime(),
    ...where,
    isPendingRevisionFor: [] as string[],
    isEmittedRevisionFor: [] as string[],
    isReceivedRevisionFor: [] as string[],
    isReviewedRevisionFor: [] as string[],
    ...getBsvhuReturnOrgIds(bsvhu),
    sirets: Object.values(where).flat(),
    ...getElasticExhaustiveRegistryFields(bsvhu),
    rawBsd: bsvhu,
    revisionRequests: [],
    nonPendingLatestRevisionRequestUpdatedAt: undefined,
    intermediaries: bsvhu.intermediaries,

    // ALL actors from the BSVHU, for quick search
    companyNames: [
      bsvhu.emitterCompanyName,
      bsvhu.transporters.map(transporter => transporter.transporterCompanyName),
      bsvhu.destinationCompanyName,
      bsvhu.ecoOrganismeName,
      bsvhu.brokerCompanyName,
      bsvhu.traderCompanyName,
      ...bsvhu.intermediaries.map(intermediary => intermediary.name)
    ]
      .filter(Boolean)
      .join(" "),
    companyOrgIds: [
      bsvhu.emitterCompanySiret,
      ...bsvhu.transporters.flatMap(transporter => [
        transporter.transporterCompanySiret,
        transporter.transporterCompanyVatNumber
      ]),
      bsvhu.destinationCompanySiret,
      bsvhu.ecoOrganismeSiret,
      bsvhu.brokerCompanySiret,
      bsvhu.traderCompanySiret,
      ...bsvhu.intermediaries.map(intermediary => intermediary.siret),
      ...bsvhu.intermediaries.map(intermediary => intermediary.vatNumber)
    ].filter(Boolean),
    // Contacts
    destinationCompanyContact: bsvhu.destinationCompanyContact ?? "",
    destinationCompanyPhone: bsvhu.destinationCompanyPhone ?? "",
    destinationCompanyMail: bsvhu.destinationCompanyMail ?? "",
    emitterCompanyContact: bsvhu.emitterCompanyContact ?? "",
    emitterCompanyPhone: bsvhu.emitterCompanyPhone ?? "",
    emitterCompanyMail: bsvhu.emitterCompanyMail ?? "",
    transporterCompanyContact: transporter?.transporterCompanyContact ?? "",
    transporterCompanyPhone: transporter?.transporterCompanyPhone ?? "",
    transporterCompanyMail: transporter?.transporterCompanyMail ?? "",
    workerCompanyContact: "",
    workerCompanyPhone: "",
    workerCompanyMail: "",
    nextDestinationCompanyContact:
      bsvhu.destinationOperationNextDestinationCompanyContact ?? "",
    nextDestinationCompanyPhone:
      bsvhu.destinationOperationNextDestinationCompanyPhone ?? "",
    nextDestinationCompanyMail:
      bsvhu.destinationOperationNextDestinationCompanyMail ?? ""
  };
}

export function indexBsvhu(
  bsvhu: BsvhuForElastic,
  ctx?: {
    gqlCtx?: GraphQLContext;
    optimisticCtx?: { seqNo: number; primaryTerm: number };
  }
) {
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
    const lastTransporter = getLastTransporterSync(bsvhu);
    return {
      isReturnFor: [
        lastTransporter?.transporterCompanySiret,
        lastTransporter?.transporterCompanyVatNumber
      ].filter(Boolean)
    };
  }

  return { isReturnFor: [] };
}
