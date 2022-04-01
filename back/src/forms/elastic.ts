import { Status } from "@prisma/client";
import prisma from "../prisma";
import { BsdElastic, indexBsd, indexBsds } from "../common/elastic";
import { FullForm } from "./types";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";

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

  const formSirets = {
    emitterCompanySiret: form.emitterCompanySiret,
    recipientCompanySiret: form.recipientCompanySiret,
    temporaryStorageDetailDestinationCompanySiret:
      form.temporaryStorageDetail?.destinationCompanySiret,
    temporaryStorageDetailTransporterCompanySiret:
      form.temporaryStorageDetail?.transporterCompanySiret,
    traderCompanySiret: form.traderCompanySiret,
    brokerCompanySiret: form.brokerCompanySiret,
    ecoOrganismeSiret: form.ecoOrganismeSiret,
    transporterCompanySiret: form.transporterCompanySiret,
    ...multimodalTransportersBySegmentId
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
      .map(item => [item[0], "isFollowFor"])
  );

  function setFieldTab(field: string, tab: keyof typeof siretsByTab) {
    if (!fieldTabs.has(field)) {
      return;
    }
    fieldTabs.set(field, tab);
  }

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
      setFieldTab("transporterCompanySiret", "isToCollectFor");

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
      setFieldTab(
        "temporaryStorageDetailTransporterCompanySiret",
        "isToCollectFor"
      );

      break;
    }
    case Status.SIGNED_BY_TEMP_STORER: {
      setFieldTab(
        "temporaryStorageDetailTransporterCompanySiret",
        "isToCollectFor"
      );

      break;
    }
    case Status.RESENT:
      setFieldTab(
        "temporaryStorageDetailTransporterCompanySiret",
        "isCollectedFor"
      );
    case Status.RECEIVED:
    case Status.ACCEPTED: {
      setFieldTab(
        form.recipientIsTempStorage
          ? "temporaryStorageDetailDestinationCompanySiret"
          : "recipientCompanySiret",
        "isForActionFor"
      );

      break;
    }
    case Status.AWAITING_GROUP:
    case Status.GROUPED:
    case Status.REFUSED:
    case Status.PROCESSED:
    case Status.NO_TRACEABILITY: {
      for (const siret of fieldTabs.keys()) {
        setFieldTab(siret, "isArchivedFor");
      }
      break;
    }
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
  return form.temporaryStorageDetail?.signedByTransporter
    ? {
        name: form.temporaryStorageDetail.destinationCompanyName,
        siret: form.temporaryStorageDetail.destinationCompanySiret
      }
    : { name: form.recipientCompanyName, siret: form.recipientCompanySiret };
}

/**
 * Convert a BSD from the forms table to Elastic Search's BSD model.
 */
function toBsdElastic(form: FullForm): BsdElastic {
  const siretsByTab = getSiretsByTab(form);
  const recipient = getRecipient(form);
  return {
    type: "BSDD",
    id: form.id,
    readableId: form.readableId,
    createdAt: form.createdAt.getTime(),
    emitterCompanyName: form.emitterCompanyName ?? "",
    emitterCompanySiret: form.emitterCompanySiret ?? "",
    transporterCompanyName: form.transporterCompanyName ?? "",
    transporterCompanySiret: form.transporterCompanySiret ?? "",
    transporterTakenOverAt: form.sentAt?.getTime(),
    destinationCompanyName: recipient.name ?? "",
    destinationCompanySiret: recipient.siret ?? "",
    destinationReceptionDate:
      form.receivedAt?.getTime() ??
      // a single v1 BSDD increment both TTR incoming wastes registry
      // and final destination incoming wastes registry. Add this line
      // to prevent sorting on null value when paginating TTR registry
      form.temporaryStorageDetail?.tempStorerReceivedAt?.getTime(),
    destinationReceptionWeight: form.quantityReceived,
    destinationOperationCode: form.processingOperationDone ?? "",
    destinationOperationDate: form.processedAt?.getTime(),
    wasteCode: form.wasteDetailsCode ?? "",
    wasteDescription: form.wasteDetailsName,
    transporterNumberPlate: [form.transporterNumberPlate],
    transporterCustomInfo: form.transporterCustomInfo,
    ...siretsByTab,
    sirets: Object.values(siretsByTab).flat(),
    ...getRegistryFields(form)
  };
}

/**
 * Index all BSDs from the forms table.
 */
export async function indexAllForms(
  idx: string,
  { skip = 0 }: { skip?: number } = {}
) {
  const take = 500;
  const forms = await prisma.form.findMany({
    skip,
    take,
    where: {
      isDeleted: false
    },
    include: {
      temporaryStorageDetail: true,
      transportSegments: true
    }
  });

  if (forms.length === 0) {
    return;
  }

  await indexBsds(
    idx,
    forms.map(form => toBsdElastic(form))
  );

  if (forms.length < take) {
    // all forms have been indexed
    return;
  }

  return indexAllForms(idx, { skip: skip + take });
}

export function indexForm(form: FullForm, ctx?: GraphQLContext) {
  return indexBsd(toBsdElastic(form), ctx);
}
