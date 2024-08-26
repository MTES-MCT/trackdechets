import { Bsda, BsdaStatus, BsdaTransporter, BsdType } from "@prisma/client";
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
import {
  getFirstTransporterSync,
  getNextTransporterSync,
  getTransportersSync
} from "./database";
import { getBsdaSubType } from "../common/subTypes";

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

// génère une clé permettant d'identifier les transporteurs de façon
// unique dans un mapping
function transporterCompanyOrgIdKey(transporter: BsdaTransporter) {
  return `transporter${transporter.number}CompanyOrgId`;
}

const getBsdaSirets = (
  bsda: BsdaForElastic
): Partial<
  Record<keyof Bsda | "transporterCompanySiret", string | null | undefined>
> => {
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

  // build a mapping that looks like
  // { transporter1CompanyOrgId: "SIRET1", transporter2CompanyOrgId: "SIRET2"}
  const transporterOrgIds = (bsda.transporters ?? []).reduce(
    (acc, transporter) => {
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
  const bsdaSirets: Partial<
    Record<keyof Bsda | "transporterCompanySiret", string | null | undefined>
  > = {
    emitterCompanySiret: bsda.emitterCompanySiret,
    ecoOrganismeSiret: bsda.ecoOrganismeSiret,
    workerCompanySiret: bsda.workerCompanySiret,
    destinationCompanySiret: bsda.destinationCompanySiret,
    brokerCompanySiret: bsda.brokerCompanySiret,
    destinationOperationNextDestinationCompanySiret:
      bsda.destinationOperationNextDestinationCompanySiret,
    ...intermediarySirets,
    ...transporterOrgIds
  };

  // Drafts only appear in the dashboard for companies the bsda owner belongs to
  if (bsda.isDraft) {
    const draftFormSiretsEntries = Object.entries(bsdaSirets).filter(
      ([, siret]) => siret && bsda.canAccessDraftOrgIds.includes(siret)
    );
    return Object.fromEntries(draftFormSiretsEntries);
  }

  return bsdaSirets;
};

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

  const firstTransporter = getFirstTransporterSync(bsda);

  const bsdaSirets = getBsdaSirets(bsda);

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
      if (
        bsda.emitterIsPrivateIndividual &&
        bsda.workerIsDisabled &&
        firstTransporter
      ) {
        setTab(
          siretsFilters,
          transporterCompanyOrgIdKey(firstTransporter),
          "isToCollectFor"
        );
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
      } else if (firstTransporter) {
        // Bsda types GATHERING and RESHIPMENT do not expect worker signature,
        // so they're ready to take over an must appear on transporter dashboard
        // (COLLECTION_2710 is directly PROCESSED and never SIGNED_BY_PRODUCER)
        setTab(
          siretsFilters,
          transporterCompanyOrgIdKey(firstTransporter),
          "isToCollectFor"
        );
      }

      break;

    case BsdaStatus.SIGNED_BY_WORKER:
      if (firstTransporter) {
        setTab(
          siretsFilters,
          transporterCompanyOrgIdKey(firstTransporter),
          "isToCollectFor"
        );
      }
      break;

    case BsdaStatus.SENT: {
      // tra-1294 ETQ destination, je souhaite avoir la possibilité de signer la réception
      // même si l'ensemble des transporteurs visés dans le bordereau n'ont pas pris en charge le déchet,
      // pouvoir gérer au mieux la réception, et éviter le cas où le bordereau serait bloqué en absence
      // d'un des transporteurs. On fait une exception à la règle dans le cas où l'installation de destination
      // est également le transporteur N+1.
      const nextTransporter = getNextTransporterSync(bsda);
      if (
        !nextTransporter ||
        nextTransporter.transporterCompanySiret !== bsda.destinationCompanySiret
      ) {
        setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
      }

      const transporters = getTransportersSync(bsda);

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
          bsda.transporters[idx - 1].transporterTransportSignatureDate
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
    bsdSubType: getBsdaSubType(bsda),
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
    destinationAcceptationWeight: bsda.destinationReceptionWeight
      ? bsda.destinationReceptionWeight.toNumber()
      : null,
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
