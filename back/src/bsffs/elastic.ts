import {
  Bsff,
  BsffStatus,
  BsdType,
  BsffTransporter,
  WasteAcceptationStatus
} from "@prisma/client";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";
import { toBsffDestination } from "./compat";
import { getTransporterCompanyOrgId } from "@td/constants";
import {
  BsffWithFicheInterventions,
  BsffWithPackagings,
  BsffWithPackagingsInclude,
  BsffWithFicheInterventionInclude,
  BsffWithTransporters,
  BsffWithTransportersInclude
} from "./types";
import { prisma } from "@td/prisma";
import {
  getFirstTransporterSync,
  getLastTransporterSync,
  getNextTransporterSync,
  getTransportersSync
} from "./database";
import { getBsffSubType } from "../common/subTypes";
import { isDefined } from "../common/helpers";
import { xDaysAgo } from "../utils";

export type BsffForElastic = Bsff &
  BsffWithPackagings &
  BsffWithFicheInterventions &
  BsffWithTransporters;

export const BsffForElasticInclude = {
  ...BsffWithPackagingsInclude,
  ...BsffWithFicheInterventionInclude,
  ...BsffWithTransportersInclude
};

export async function getBsffForElastic(
  bsff: Pick<Bsff, "id">
): Promise<BsffForElastic> {
  return prisma.bsff.findUniqueOrThrow({
    where: { id: bsff.id },
    include: BsffForElasticInclude
  });
}

// Renvoie pour chaque transporteur son rôle (transporter1, transporter2, etc)
function transporterCompanyRole(transporter: BsffTransporter) {
  return `transporter${transporter.number}`;
}
const getOrgIdByRole = bsff => {
  // build a mapping that looks like
  // { transporter1CompanyOrgId: "SIRET1", transporter2CompanyOrgId: "SIRET2"}
  const transporterOrgIdByRole = (bsff.transporters ?? []).reduce(
    (acc, transporter) => {
      const orgId = getTransporterCompanyOrgId(transporter);
      if (orgId) {
        return {
          ...acc,
          [transporterCompanyRole(transporter)]: orgId
        };
      }
      return acc;
    },
    {}
  );
  const detenteurSiretByRole = bsff.ficheInterventions.reduce(
    (sirets, ficheIntervention) => {
      if (ficheIntervention.detenteurCompanySiret) {
        const nbOfKeys = Object.keys(sirets).length;
        return {
          ...sirets,
          [`detenteur${nbOfKeys + 1}`]: ficheIntervention.detenteurCompanySiret
        };
      }
      return sirets;
    },
    {}
  );
  const orgIdByRole = {
    emitter: bsff.emitterCompanySiret,
    destination: bsff.destinationCompanySiret,
    ...detenteurSiretByRole,
    ...transporterOrgIdByRole
  };

  if (bsff.isDraft) {
    // Drafts appear in the dashboard only for companies the bsff owner belongs to

    const draftFormSiretsEntries = Object.entries(orgIdByRole).filter(
      ([, siret]) => siret && bsff.canAccessDraftOrgIds.includes(siret)
    );
    return Object.fromEntries(draftFormSiretsEntries);
  }

  return orgIdByRole;
};

type TabsKeys =
  | "isDraftFor"
  | "isForActionFor"
  | "isFollowFor"
  | "isArchivedFor"
  | "isToCollectFor"
  | "isCollectedFor";

/**
 * Renvoie pour chaque statut du bordereau les différents onglets (Brouillon, Pour Action, etc)
 * et les identifiants des établissements qui sont associés à chaque onglet.
 */
export function getOrgIdsByTab(
  bsff: BsffForElastic
): Pick<BsdElastic, TabsKeys> {
  const tabs: Record<TabsKeys, string[]> = {
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: []
  };

  const firstTransporter = getFirstTransporterSync(bsff);

  // Crée un mapping qui associe à chaque rôle sur le BSFF
  // (ex : "emitter", "destination","transporter1", etc)
  // l'identifiant de l'établissement correspondant.
  const orgIdByRole = getOrgIdByRole(bsff);
  const roles = Object.keys(orgIdByRole);

  // Crée un mapping qui associe pour chaque rôle l'onglet
  // où le BSFF doit apparaitre. Défaut à "Suivi" pour chaque rôle.
  const tabsByRole = roles.reduce((acc, role) => {
    if (orgIdByRole[role]) {
      return { ...acc, [role]: "isFollowFor" };
    }
    return acc;
  }, {});

  // Fonction permettant de modifier l'onglet dans lequel
  // le bordereau doit apparaitre pour un rôle donné
  function setTab(role: string, tab: TabsKeys) {
    if (tabsByRole[role]) {
      tabsByRole[role] = tab;
    }
  }

  switch (bsff.status) {
    case BsffStatus.INITIAL:
      if (bsff.isDraft) {
        for (const role of roles) {
          setTab(role, "isDraftFor");
        }
        break;
      }
      setTab("emitter", "isForActionFor");
      break;

    case BsffStatus.SIGNED_BY_EMITTER:
      if (firstTransporter) {
        setTab(transporterCompanyRole(firstTransporter), "isToCollectFor");
      }
      break;

    case BsffStatus.SENT: {
      // ETQ destination, je souhaite avoir la possibilité de signer la réception
      // même si l'ensemble des transporteurs visés dans le bordereau n'ont pas pris en charge le déchet,
      // pouvoir gérer au mieux la réception, et éviter le cas où le bordereau serait bloqué en absence
      // d'un des transporteurs. On fait une exception à la règle dans le cas où l'installation de destination
      // est également le transporteur N+1.
      const nextTransporter = getNextTransporterSync(bsff);
      if (
        !nextTransporter ||
        nextTransporter.transporterCompanySiret !== bsff.destinationCompanySiret
      ) {
        setTab("destination", "isForActionFor");
      }

      const transporters = getTransportersSync(bsff);

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
            setTab(transporterCompanyRole(transporter), "isCollectedFor");
          }
        } else if (
          // le bordereau est "à collecter" soit par le premier transporteur
          // (géré dans case SIGNED_BY_PRODUCER) soit par le transporteur N+1 dès lors que
          // le transporteur N a signé.
          idx > 0 &&
          bsff.transporters[idx - 1].transporterTransportSignatureDate
        ) {
          setTab(transporterCompanyRole(transporter), "isToCollectFor");
        }
      });
      break;
    }
    case BsffStatus.RECEIVED:
    case BsffStatus.PARTIALLY_REFUSED:
    case BsffStatus.ACCEPTED: {
      setTab("destination", "isForActionFor");
      break;
    }
    case BsffStatus.REFUSED:
    case BsffStatus.PROCESSED:
      for (const role of roles) {
        setTab(role, "isArchivedFor");
      }
      break;

    case BsffStatus.INTERMEDIATELY_PROCESSED:
    default:
      break;
  }

  for (const role of roles) {
    const tab = tabsByRole[role];
    if (tab) {
      const orgId = orgIdByRole[role];
      tabs[tab].push(orgId);
    }
  }

  return tabs;
}

export function toBsdElastic(bsff: BsffForElastic): BsdElastic {
  const bsffDestination = toBsffDestination(bsff.packagings);
  const transporter = getFirstTransporterSync(bsff);

  const tabs = getOrgIdsByTab(bsff);

  const bsd = {
    type: BsdType.BSFF,
    bsdSubType: getBsffSubType(bsff),
    createdAt: bsff.createdAt?.getTime(),
    updatedAt: bsff.updatedAt?.getTime(),
    id: bsff.id,
    readableId: bsff.id,
    customId: "",
    status: bsff.status,
    wasteCode: bsff.wasteCode ?? "",
    wasteAdr: bsff.wasteAdr ?? "",
    wasteDescription: bsff.wasteDescription ?? "",
    packagingNumbers: bsff.packagings?.map(p => p.numero) ?? [],
    wasteSealNumbers: [],
    identificationNumbers: [],
    ficheInterventionNumbers:
      bsff.ficheInterventions?.map(fi => fi.numero) ?? [],
    emitterCompanyName: bsff.emitterCompanyName ?? "",
    emitterCompanySiret: bsff.emitterCompanySiret ?? "",
    emitterCompanyAddress: bsff.emitterCompanyAddress ?? "",
    emitterPickupSiteName: "",
    emitterPickupSiteAddress: "",
    emitterCustomInfo: bsff.emitterCustomInfo ?? "",
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

    destinationCompanyName: bsff.destinationCompanyName ?? "",
    destinationCompanySiret: bsff.destinationCompanySiret ?? "",
    destinationCompanyAddress: bsff.destinationCompanyAddress ?? "",
    destinationCustomInfo: bsff.destinationCustomInfo ?? "",
    destinationCap: bsff.destinationCap ?? "",

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

    destinationOperationCode: "",
    destinationOperationMode: undefined,

    emitterEmissionDate: bsff.emitterEmissionSignatureDate?.getTime(),
    workerWorkDate: undefined,
    transporterTransportTakenOverAt:
      transporter?.transporterTransportTakenOverAt?.getTime() ??
      transporter?.transporterTransportSignatureDate?.getTime(),
    destinationReceptionDate: bsff.destinationReceptionDate?.getTime(),
    destinationAcceptationDate: bsffDestination?.receptionDate?.getTime(),
    destinationAcceptationWeight: bsffDestination?.receptionWeight,
    destinationOperationDate: bsffDestination?.operationDate?.getTime(),
    ...tabs,
    isPendingRevisionFor: [] as string[],
    isEmittedRevisionFor: [] as string[],
    isReceivedRevisionFor: [] as string[],
    isReviewedRevisionFor: [] as string[],
    ...getBsffReturnOrgIds(bsff),
    sirets: Object.values(tabs).flat(),
    ...getRegistryFields(bsff),
    rawBsd: bsff,
    revisionRequests: [],

    // ALL actors from the BSFF, for quick search
    companyNames: [
      bsff.emitterCompanyName,
      ...bsff.transporters.map(t => t.transporterCompanyName),
      bsff.destinationCompanyName,
      ...bsff.ficheInterventions.map(fiche => fiche.detenteurCompanyName)
    ]
      .filter(Boolean)
      .join(" "),
    companyOrgIds: [
      bsff.emitterCompanySiret,
      ...bsff.transporters.flatMap(t => [
        t.transporterCompanySiret,
        t.transporterCompanyVatNumber
      ]),
      bsff.destinationCompanySiret,
      ...bsff.ficheInterventions.map(fiche => fiche.detenteurCompanySiret)
    ].filter(Boolean)
  };

  return bsd;
}

export async function indexBsff(bsff: BsffForElastic, ctx?: GraphQLContext) {
  return indexBsd(toBsdElastic(bsff), ctx);
}

/**
 * BSFF belongs to isReturnFor tab if:
 * - waste has been received in the last 48 hours
 * - at least one packaging hasn't been fully accepted
 */
export const belongsToIsReturnForTab = (bsff: BsffForElastic) => {
  const hasBeenReceivedLately =
    isDefined(bsff.destinationReceptionDate) &&
    bsff.destinationReceptionDate! > xDaysAgo(new Date(), 2);

  if (!hasBeenReceivedLately) return false;

  const hasNotBeenFullyAccepted =
    bsff.status === BsffStatus.REFUSED ||
    bsff.packagings.some(
      packaging =>
        packaging.acceptationStatus !== WasteAcceptationStatus.ACCEPTED
    );

  return hasNotBeenFullyAccepted;
};

function getBsffReturnOrgIds(bsff: BsffForElastic): { isReturnFor: string[] } {
  // Return tab
  if (belongsToIsReturnForTab(bsff)) {
    const transporters = bsff?.transporters ?? [];
    const lastTransporter = getLastTransporterSync({ transporters });

    return {
      isReturnFor: [lastTransporter?.transporterCompanySiret].filter(Boolean)
    };
  }

  return { isReturnFor: [] };
}
