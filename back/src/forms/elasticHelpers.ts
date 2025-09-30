import {
  BsddTransporter,
  EmitterType,
  Status,
  WasteAcceptationStatus
} from "@td/prisma";
import { BsdElastic } from "../common/elastic";
import { FullForm } from "./types";

import { getTransporterCompanyOrgId } from "@td/constants";
import {
  getFirstTransporterSync,
  getLastTransporterSync,
  getNextTransporterSync,
  getTransportersSync
} from "./database";
import { FormForElastic } from "./elastic";
import { getRevisionOrgIds, RevisionTab } from "../common/elasticHelpers";
import { isDefined } from "../common/helpers";
import { xDaysAgo } from "../utils";

/**
 * Computes which SIRET or VAT number should appear on which tab in the frontend
 * (Brouillon, Pour Action, Suivi, Archives, À collecter, Collecté)
 */

export function getRecipient(form: FullForm) {
  return form.forwardedIn?.emittedAt
    ? {
        name: form.forwardedIn.recipientCompanyName,
        siret: form.forwardedIn.recipientCompanySiret,
        address: form.forwardedIn.recipientCompanyAddress,
        cap: form.forwardedIn.recipientCap
      }
    : {
        name: form.recipientCompanyName,
        siret: form.recipientCompanySiret,
        address: form.recipientCompanyAddress,
        cap: form.recipientCap
      };
}

type WhereKeys =
  | "isDraftFor"
  | "isForActionFor"
  | "isFollowFor"
  | "isArchivedFor"
  | "isToCollectFor"
  | "isCollectedFor";

// génère une clé permettant d'identifier les transporteurs de façon
// unique dans un mapping
function transporterCompanyOrgIdKey(transporter: BsddTransporter) {
  return `transporter${transporter.number}CompanyOrgId`;
}

export function getSiretsByTab(form: FullForm): Pick<BsdElastic, WhereKeys> {
  const formSirets = getFormSirets(form);

  const siretsByTab: Record<WhereKeys, string[]> = {
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: []
  };

  // build a mapping to store which actor will see this form appear on a given UI tab
  // eg: 'transporterCompanySiret' : 'isCollectedFor'
  const fieldTabs = new Map<string, keyof typeof siretsByTab>(
    Object.entries(formSirets)
      .filter(item => !!item[1])
      // initialize all SIRET into "isFollowFor"
      .map(item => [item[0], "isFollowFor"])
  );

  function setFieldTab(field: string, tab: keyof typeof siretsByTab) {
    if (!fieldTabs.has(field)) {
      return;
    }
    fieldTabs.set(field, tab);
  }

  // initialize intermediaries into isFollowFor
  form.intermediaries?.forEach(({ siret }) =>
    setFieldTab(`intermediarySiret${siret}`, "isFollowFor")
  );

  const firstTransporter = getFirstTransporterSync(form);

  switch (form.status) {
    case Status.DRAFT: {
      for (const fieldName of fieldTabs.keys()) {
        setFieldTab(fieldName, "isDraftFor");
      }
      break;
    }
    case Status.SEALED: {
      setFieldTab("emitterCompanySiret", "isForActionFor");
      setFieldTab("ecoOrganismeSiret", "isForActionFor");
      if (form.emitterType !== EmitterType.APPENDIX1 && firstTransporter) {
        setFieldTab(
          transporterCompanyOrgIdKey(firstTransporter),
          "isToCollectFor"
        );
      }

      break;
    }
    case Status.SIGNED_BY_PRODUCER: {
      if (firstTransporter) {
        setFieldTab(
          transporterCompanyOrgIdKey(firstTransporter),
          "isToCollectFor"
        );
      }

      break;
    }
    case Status.SENT: {
      // tra-1294 ETQ destination, je souhaite avoir la possibilité de signer la réception
      // même si l'ensemble des transporteurs visés dans le bordereau n'ont pas pris en charge le déchet,
      // pouvoir gérer au mieux la réception, et éviter le cas où le bordereau serait bloqué en absence
      // d'un des transporteurs. On fait une exception à la règle dans le cas où l'installation de destination
      // est également le transporteur N+1.
      const nextTransporter = getNextTransporterSync(form);
      if (
        !nextTransporter ||
        nextTransporter.transporterCompanySiret !== form.recipientCompanySiret
      ) {
        setFieldTab("recipientCompanySiret", "isForActionFor");
      }

      const transporters = getTransportersSync(form);

      transporters.forEach((transporter, idx) => {
        if (transporter.takenOverAt) {
          // `handedOver` permet de savoir si le transporteur
          // N+1 a également pris en charge le déchet, si c'est le
          // cas le bordereau ne doit pas apparaitre dans l'onglet "Collecté"
          // du transporteur N
          const handedOver = transporters.find(
            t => t.number > transporter.number && t.takenOverAt
          );

          if (!handedOver) {
            setFieldTab(
              transporterCompanyOrgIdKey(transporter),
              "isCollectedFor"
            );
          }
        } else if (
          // le bordereau est "à collecter" soit par le premier transporteur
          // (géré dans case SIGNED_BY_PRODUCER) soit par le transporteur N+1 dès lors que
          // le transporteur N a signé.
          // Pour la rétro-compatibilité avec le multi-modal v1 on vérifie aussi `readyToTakeOver`
          idx > 0 &&
          form.transporters[idx - 1].takenOverAt &&
          transporter.readyToTakeOver // toujours true en cas de multi-modal v2
        ) {
          setFieldTab(
            transporterCompanyOrgIdKey(transporter),
            "isToCollectFor"
          );
        }
      });

      break;
    }
    case Status.TEMP_STORED:
    case Status.TEMP_STORER_ACCEPTED: {
      setFieldTab("recipientCompanySiret", "isForActionFor");
      break;
    }
    case Status.RESEALED: {
      setFieldTab("recipientCompanySiret", "isForActionFor");
      setFieldTab("forwardedInTransporterCompanySiret", "isToCollectFor");

      break;
    }
    case Status.SIGNED_BY_TEMP_STORER: {
      setFieldTab("forwardedInTransporterCompanySiret", "isToCollectFor");

      break;
    }
    case Status.RESENT: {
      setFieldTab("forwardedInTransporterCompanySiret", "isCollectedFor");
      setFieldTab(
        form.recipientIsTempStorage
          ? "forwardedInDestinationCompanySiret"
          : "recipientCompanySiret",
        "isForActionFor"
      );

      break;
    }
    case Status.RECEIVED:
    case Status.ACCEPTED: {
      setFieldTab(
        form.recipientIsTempStorage
          ? "forwardedInDestinationCompanySiret"
          : "recipientCompanySiret",
        "isForActionFor"
      );

      break;
    }
    case Status.REFUSED:
    case Status.PROCESSED:
    case Status.FOLLOWED_WITH_PNTTD:
    case Status.CANCELED:
    case Status.NO_TRACEABILITY: {
      for (const siret of fieldTabs.keys()) {
        setFieldTab(siret, "isArchivedFor");
      }
      break;
    }
    case Status.GROUPED:
    case Status.AWAITING_GROUP:
    default:
      break;
  }

  for (const [field, tab] of fieldTabs.entries()) {
    if (field) {
      siretsByTab[tab].push(formSirets[field]);
    }
  }

  return siretsByTab;
}

/**
 * BSDD belongs to isReturnFor tab if:
 * - waste has been received in the last 48 hours
 * - waste has citerne business (emptyReturnADR or citerne washed) OR waste hasn't been fully accepted
 */
export const belongsToIsReturnForTab = (form: FullForm) => {
  const hasBeenReceivedLately =
    isDefined(form.receivedAt) && form.receivedAt! > xDaysAgo(new Date(), 2);

  if (!hasBeenReceivedLately) return false;

  const hasCiterneBusiness =
    isDefined(form.emptyReturnADR) || isDefined(form.hasCiterneBeenWashedOut);

  const hasNotBeenFullyAccepted =
    form.status === Status.REFUSED ||
    form.wasteAcceptationStatus !== WasteAcceptationStatus.ACCEPTED;

  return hasCiterneBusiness || hasNotBeenFullyAccepted;
};

export function getFormReturnOrgIds(form: FullForm) {
  // Return tab
  if (belongsToIsReturnForTab(form)) {
    const lastTransporter = getLastTransporterSync(form);

    return {
      isReturnFor: [lastTransporter?.transporterCompanySiret].filter(Boolean)
    };
  }

  return { isReturnFor: [] };
}

function getFormSirets(form: FullForm) {
  const transporter = getFirstTransporterSync(form);

  // Appendix 1 only appears in the dashboard for emitters & transporters & EO
  if (form.emitterType === EmitterType.APPENDIX1_PRODUCER) {
    return {
      emitterCompanySiret: form.emitterCompanySiret,
      ecoOrganismeSiret: form.ecoOrganismeSiret,
      ...(transporter
        ? {
            [transporterCompanyOrgIdKey(transporter)]:
              getTransporterCompanyOrgId(transporter)
          }
        : {})
    };
  }

  // build a mapping that looks like
  // { transporter1CompanyOrgId: "SIRET1", transporter2CompanyOrgId: "SIRET2"}
  const transporterOrgIds = (form.transporters ?? []).reduce(
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

  const intermediarySiretsReducer = form.intermediaries?.reduce(
    (acc, intermediary) => {
      if (!!intermediary.siret) {
        return {
          ...acc,
          [`intermediarySiret${intermediary.siret}`]: intermediary.siret
        };
      }
      return acc;
    },
    {}
  );

  const allFormSirets = {
    emitterCompanySiret: form.emitterCompanySiret,
    recipientCompanySiret: form.recipientCompanySiret,
    forwardedInDestinationCompanySiret: form.forwardedIn?.recipientCompanySiret,
    forwardedInTransporterCompanySiret: getTransporterCompanyOrgId(
      form.forwardedIn ? getFirstTransporterSync(form.forwardedIn) : null
    ),
    traderCompanySiret: form.traderCompanySiret,
    brokerCompanySiret: form.brokerCompanySiret,
    ecoOrganismeSiret: form.ecoOrganismeSiret,
    ...transporterOrgIds,
    ...intermediarySiretsReducer
  };

  // Drafts only appear in the dashboard for companies the form owner belongs to
  if (form.status === Status.DRAFT) {
    const draftFormSiretsEntries = Object.entries(allFormSirets).filter(
      ([, siret]) => siret && form.canAccessDraftSirets.includes(siret)
    );
    return Object.fromEntries(draftFormSiretsEntries);
  }

  return allFormSirets;
}

/**
 * Pour un BSDD donné, retourne l'ensemble identifiants d'établissements
 * pour lesquels il y a une demande de révision en cours ou passé.
 */
export function getFormRevisionOrgIds(
  form: FormForElastic
): Pick<BsdElastic, RevisionTab> {
  return getRevisionOrgIds(form.bsddRevisionRequests);
}
