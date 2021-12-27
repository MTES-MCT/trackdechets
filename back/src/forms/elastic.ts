import { Status } from "@prisma/client";
import prisma from "../prisma";
import { BsdElastic, indexBsd, indexBsds } from "../common/elastic";
import { FullForm } from "./types";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";

function getWhere(
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
  const segments = form.transportSegments
    .filter(segment => !!segment.transporterCompanySiret)
    .map(segment => ({
      [`${segment.id}`]: segment.transporterCompanySiret
    }))
    .reduce((el, acc) => ({ ...acc, ...el }), {});

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
    ...segments
  };

  const where = {
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: []
  };

  type Mapping = Map<string, keyof typeof where>;
  /**
   * Set where clause to a given mapping
   */
  const appendToSirets = (
    map: Mapping,
    key: string,
    newValue: keyof typeof where
  ) => {
    if (!map.has(key)) {
      return;
    }

    map.set(key, newValue);
  };

  // build a mapping to store which actor will see this form appear on a given UI tab
  // eg: 'transporterCompanySiret' : 'isCollectedFor'
  const siretsFilters = new Map<string, keyof typeof where>(
    Object.entries(formSirets)
      .filter(item => !!item[1])
      .map(item => [item[0], "isFollowFor"])
  );
  switch (form.status) {
    case Status.DRAFT: {
      for (const fieldName of siretsFilters.keys()) {
        appendToSirets(siretsFilters, fieldName, "isDraftFor");
      }
      break;
    }
    case Status.SEALED: {
      appendToSirets(
        siretsFilters,
        "transporterCompanySiret",
        "isToCollectFor"
      );

      break;
    }
    case Status.SENT: {
      appendToSirets(siretsFilters, "recipientCompanySiret", "isForActionFor");
      appendToSirets(
        siretsFilters,
        "transporterCompanySiret",
        "isCollectedFor"
      );

      form.transportSegments.forEach(segment => {
        if (segment.readyToTakeOver) {
          appendToSirets(
            siretsFilters,
            segment.id,
            segment.takenOverAt ? "isCollectedFor" : "isToCollectFor"
          );
        }
      });

      break;
    }
    case Status.TEMP_STORED:
    case Status.TEMP_STORER_ACCEPTED: {
      appendToSirets(siretsFilters, "recipientCompanySiret", "isForActionFor");
      appendToSirets(
        siretsFilters,
        "transporterCompanySiret",
        "isCollectedFor"
      );

      form.transportSegments.forEach(segment => {
        appendToSirets(siretsFilters, segment.id, "isCollectedFor");
      });

      break;
    }
    case Status.RESEALED: {
      appendToSirets(
        siretsFilters,
        "temporaryStorageDetailTransporterCompanySiret",
        "isToCollectFor"
      );

      appendToSirets(
        siretsFilters,
        "transporterCompanySiret",
        "isCollectedFor"
      );
      form.transportSegments.forEach(segment => {
        appendToSirets(siretsFilters, segment.id, "isCollectedFor");
      });

      break;
    }
    case Status.RESENT:
    case Status.RECEIVED:
    case Status.ACCEPTED: {
      appendToSirets(
        siretsFilters,
        form.recipientIsTempStorage
          ? "temporaryStorageDetailDestinationCompanySiret"
          : "recipientCompanySiret",
        "isForActionFor"
      );

      appendToSirets(
        siretsFilters,
        "temporaryStorageDetailTransporterCompanySiret",
        "isCollectedFor"
      );

      appendToSirets(
        siretsFilters,
        "transporterCompanySiret",
        "isCollectedFor"
      );

      form.transportSegments.forEach(segment => {
        appendToSirets(siretsFilters, segment.id, "isCollectedFor");
      });

      break;
    }
    case Status.AWAITING_GROUP:
    case Status.GROUPED: {
      appendToSirets(
        siretsFilters,
        "temporaryStorageDetailTransporterCompanySiret",
        "isCollectedFor"
      );

      appendToSirets(
        siretsFilters,
        "transporterCompanySiret",
        "isCollectedFor"
      );

      form.transportSegments.forEach(segment => {
        appendToSirets(siretsFilters, segment.id, "isCollectedFor");
      });

      break;
    }
    case Status.REFUSED:
    case Status.PROCESSED:
    case Status.NO_TRACEABILITY: {
      for (const siret of siretsFilters.keys()) {
        appendToSirets(siretsFilters, siret, "isArchivedFor");
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
  const where = getWhere(form);
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
    ...where,
    sirets: Object.values(where).flat(),
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
