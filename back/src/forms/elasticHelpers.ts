import { EmitterType, Status } from "@prisma/client";
import { BsdElastic } from "../common/elastic";
import { FullForm } from "./types";

import { getTransporterCompanyOrgId } from "../common/constants/companySearchHelpers";
import { getFirstTransporterSync } from "./database";

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

export function getSiretsByTab(form: FullForm): Pick<BsdElastic, WhereKeys> {
  // we build a mapping where each key has to be unique.
  // Same siret can be used by different actors on the same form, so we can't use them as keys.
  // Instead we rely on field names and segments ids
  const multimodalTransportersBySegmentId = (form.transporters ?? [])
    .filter(t => t.number && t.number > 1)
    .reduce((acc, segment) => {
      if (!!getTransporterCompanyOrgId(segment)) {
        return {
          ...acc,
          [`${segment.id}`]: getTransporterCompanyOrgId(segment)
        };
      }
      return acc;
    }, {});

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

  const transporter = getFirstTransporterSync(form);

  const formSirets =
    form.emitterType === EmitterType.APPENDIX1_PRODUCER
      ? {
          // Appendix 1 only appears in the dashboard for emitters & transporters
          emitterCompanySiret: form.emitterCompanySiret,
          transporterCompanySiret: getTransporterCompanyOrgId(transporter)
        }
      : {
          emitterCompanySiret: form.emitterCompanySiret,
          recipientCompanySiret: form.recipientCompanySiret,
          forwardedInDestinationCompanySiret:
            form.forwardedIn?.recipientCompanySiret,
          forwardedInTransporterCompanySiret: getTransporterCompanyOrgId(
            form.forwardedIn ? getFirstTransporterSync(form.forwardedIn) : null
          ),
          traderCompanySiret: form.traderCompanySiret,
          brokerCompanySiret: form.brokerCompanySiret,
          ecoOrganismeSiret: form.ecoOrganismeSiret,
          transporterCompanySiret: getTransporterCompanyOrgId(transporter),
          ...multimodalTransportersBySegmentId,
          ...intermediarySiretsReducer
        };

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
      if (form.emitterType !== EmitterType.APPENDIX1) {
        setFieldTab("transporterCompanySiret", "isToCollectFor");
      }

      break;
    }
    case Status.SIGNED_BY_PRODUCER: {
      // // Emitter is also transporter (not regroupement nor annexe 1)
      // if (
      //   form.emitterType !== "APPENDIX1" && // Annexe 1
      //   form.emitterType !== "APPENDIX2" && // Regroupement
      //   form.transporterCompanySiret &&
      //   form.emitterCompanySiret &&
      //   form.emitterCompanySiret === form.transporterCompanySiret
      // ) {
      //   setFieldTab("transporterCompanySiret", "isForActionFor");
      // } else {
      // }
      setFieldTab("transporterCompanySiret", "isToCollectFor");

      break;
    }
    case Status.SENT: {
      setFieldTab("recipientCompanySiret", "isForActionFor");
      // whether or not this BSD has been handed over by transporter n°1
      let hasBeenHandedOver = false;

      form.transporters
        ?.filter(t => t.number && t.number >= 2)
        .forEach(segment => {
          if (segment.readyToTakeOver) {
            hasBeenHandedOver = hasBeenHandedOver || !!segment.takenOverAt;
            setFieldTab(
              segment.id,
              segment.takenOverAt ? "isCollectedFor" : "isToCollectFor"
            );
          }
        });

      if (!hasBeenHandedOver) {
        setFieldTab("transporterCompanySiret", "isCollectedFor");
      }

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
    case Status.RESENT:
      setFieldTab("forwardedInTransporterCompanySiret", "isCollectedFor");
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
    case Status.GROUPED:
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
