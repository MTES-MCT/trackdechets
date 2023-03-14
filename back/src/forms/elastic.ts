import { EmitterType, Form, Status } from "@prisma/client";
import { BsdElastic, indexBsd, transportPlateFilter } from "../common/elastic";
import { FullForm } from "./types";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";
import { getTransporterCompanyOrgId } from "../common/constants/companySearchHelpers";
import { buildAddress } from "../companies/sirene/utils";

/**
 * Computes which SIRET should appear on which tab in the frontend
 * (Brouillon, Pour Action, Suivi, Archives, À collecter, Collecté)
 */
export function getSiretsByTab(
  form: FullForm
): Pick<
  BsdElastic,
  | "isDraftFor"
  | "isForActionFor"
  | "isFollowFor"
  | "isArchivedFor"
  | "isToCollectFor"
  | "isCollectedFor"
> {
  // we build a mapping where each key has to be unique.
  // Same siret can be used by different actors on the same form, so we can't use them as keys.
  // Instead we rely on field names and segments ids
  const multimodalTransportersBySegmentId = form.transportSegments.reduce(
    (acc, segment) => {
      if (!!segment.transporterCompanySiret) {
        return { ...acc, [`${segment.id}`]: segment.transporterCompanySiret };
      }
      return acc;
    },
    {}
  );

  const intermediarySiretsReducer = form.intermediaries.reduce(
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

  const formSirets =
    form.emitterType === EmitterType.APPENDIX1_PRODUCER
      ? {
          // Appendix 1 only appears in the dashboard for emitters & transporters
          emitterCompanySiret: form.emitterCompanySiret,
          transporterCompanySiret: getTransporterCompanyOrgId(form)
        }
      : {
          emitterCompanySiret: form.emitterCompanySiret,
          recipientCompanySiret: form.recipientCompanySiret,
          forwardedInDestinationCompanySiret:
            form.forwardedIn?.recipientCompanySiret,
          forwardedInTransporterCompanySiret: getTransporterCompanyOrgId(
            form.forwardedIn
          ),
          traderCompanySiret: form.traderCompanySiret,
          brokerCompanySiret: form.brokerCompanySiret,
          ecoOrganismeSiret: form.ecoOrganismeSiret,
          transporterCompanySiret: getTransporterCompanyOrgId(form),
          ...multimodalTransportersBySegmentId,
          ...intermediarySiretsReducer
        };

  const siretsByTab = {
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
  form.intermediaries.forEach(({ siret }) =>
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
      setFieldTab("transporterCompanySiret", "isToCollectFor");

      break;
    }
    case Status.SENT: {
      setFieldTab("recipientCompanySiret", "isForActionFor");

      // whether or not this BSD has been handed over by transporter n°1
      let hasBeenHandedOver = false;

      form.transportSegments.forEach(segment => {
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

function getRecipient(form: FullForm) {
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

/**
 * Convert a BSD from the forms table to Elastic Search's BSD model.
 */
export function toBsdElastic(
  form: FullForm & { forwarding?: Form }
): BsdElastic {
  const siretsByTab = getSiretsByTab(form);
  const recipient = getRecipient(form);

  return {
    type: "BSDD",
    createdAt: form.createdAt?.getTime(),
    updatedAt: form.updatedAt?.getTime(),
    id: form.id,
    readableId: form.readableId,
    customId: form.customId ?? "",
    status: form.status,
    wasteCode: form.wasteDetailsCode ?? "",
    wasteAdr: form.wasteDetailsOnuCode ?? "",
    wasteDescription: form.wasteDetailsName ?? "",
    packagingNumbers: [],
    wasteSealNumbers: [],
    identificationNumbers: [],
    ficheInterventionNumbers: [],
    emitterCompanyName: form.emitterCompanyName ?? "",
    emitterCompanySiret: form.emitterCompanySiret ?? "",
    emitterCompanyAddress: form.emitterCompanyAddress ?? "",
    emitterPickupSiteName: form.emitterWorkSiteName ?? "",
    emitterPickupSiteAddress: buildAddress([
      form.emitterWorkSiteAddress,
      form.emitterWorkSitePostalCode,
      form.emitterWorkSiteCity
    ]),
    emitterCustomInfo: "",
    workerCompanyName: "",
    workerCompanySiret: "",
    workerCompanyAddress: "",

    transporterCompanyName: form.transporterCompanyName ?? "",
    transporterCompanySiret: form.transporterCompanySiret ?? "",
    transporterCompanyVatNumber: form.transporterCompanyVatNumber ?? "",
    transporterCompanyAddress: form.transporterCompanyAddress ?? "",
    transporterCustomInfo: form.transporterCustomInfo ?? "",
    transporterTransportPlates: form.transporterNumberPlate
      ? [transportPlateFilter(form.transporterNumberPlate)]
      : [],

    destinationCompanyName: recipient.name ?? "",
    destinationCompanySiret: recipient.siret ?? "",
    destinationCompanyAddress: recipient.address ?? "",
    destinationCustomInfo: "",
    destinationCap: recipient.cap ?? "",

    brokerCompanyName: form.brokerCompanyName ?? "",
    brokerCompanySiret: form.brokerCompanySiret ?? "",
    brokerCompanyAddress: form.brokerCompanyAddress ?? "",

    traderCompanyName: "",
    traderCompanySiret: "",
    traderCompanyAddress: "",

    ecoOrganismeName: form.ecoOrganismeName ?? "",
    ecoOrganismeSiret: form.ecoOrganismeSiret ?? "",

    nextDestinationCompanyName: form.nextDestinationCompanyName ?? "",
    nextDestinationCompanySiret: form.nextDestinationCompanySiret ?? "",
    nextDestinationCompanyVatNumber: form.nextDestinationCompanyVatNumber ?? "",
    nextDestinationCompanyAddress: form.nextDestinationCompanyAddress ?? "",

    destinationOperationCode: form.processingOperationDone ?? "",

    emitterEmissionDate: form.emittedAt?.getTime(),
    workerWorkDate: null,
    transporterTransportTakenOverAt:
      form.takenOverAt?.getTime() ?? form.sentAt?.getTime(),
    destinationReceptionDate: form.receivedAt?.getTime(),
    destinationAcceptationDate: form.signedAt?.getTime(),
    destinationAcceptationWeight: form.quantityReceived,
    destinationOperationDate: form.processedAt?.getTime(),
    ...(form.forwarding
      ? {
          // do not display BSD suite in dashboard
          isDraftFor: [],
          isForActionFor: [],
          isFollowFor: [],
          isArchivedFor: [],
          isToCollectFor: [],
          isCollectedFor: []
        }
      : siretsByTab),
    sirets: Object.values(siretsByTab).flat(),
    ...getRegistryFields(form),
    intermediaries: form.intermediaries,
    rawBsd: form
  };
}

export async function indexForm(
  form: FullForm,
  ctx?: GraphQLContext
): Promise<BsdElastic> {
  // prevent unwanted cascaded reindexation
  if (form.isDeleted) {
    return null;
  }
  if (form.forwardedIn) {
    // index next BSD asynchronously
    indexBsd(
      toBsdElastic({
        ...form.forwardedIn,
        transportSegments: [],
        intermediaries: [],
        forwardedIn: null,
        forwarding: form
      })
    );
  }
  const bsdElastic = toBsdElastic(form);
  await indexBsd(bsdElastic, ctx);
  return bsdElastic;
}
