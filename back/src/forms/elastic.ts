import { Status } from "@prisma/client";
import prisma from "../prisma";
import { BsdElastic, indexBsd, indexBsds } from "../common/elastic";
import { FullForm } from "./types";

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
  const where = {
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: []
  };
  const sirets = new Map<string, keyof typeof where>(
    [
      form.emitterCompanySiret,
      form.recipientCompanySiret,
      form.temporaryStorageDetail?.destinationCompanySiret,
      form.transporterCompanySiret,
      ...form.transportSegments.map(segment => segment.transporterCompanySiret),
      form.temporaryStorageDetail?.transporterCompanySiret,
      form.traderCompanySiret,
      form.brokerCompanySiret,
      form.ecoOrganismeSiret
    ].map(siret => [siret, "isFollowFor"])
  );

  switch (form.status) {
    case Status.DRAFT: {
      for (const siret of sirets.keys()) {
        sirets.set(siret, "isDraftFor");
      }
      break;
    }
    case Status.SEALED: {
      sirets.set(form.transporterCompanySiret, "isToCollectFor");
      break;
    }
    case Status.SENT: {
      sirets.set(form.recipientCompanySiret, "isForActionFor");
      sirets.set(form.transporterCompanySiret, "isCollectedFor");

      form.transportSegments.forEach(segment => {
        if (segment.readyToTakeOver) {
          sirets.set(
            segment.transporterCompanySiret,
            segment.takenOverAt ? "isCollectedFor" : "isToCollectFor"
          );
        }
      });
      break;
    }
    case Status.TEMP_STORED:
    case Status.TEMP_STORER_ACCEPTED: {
      sirets.set(form.recipientCompanySiret, "isForActionFor");
      sirets.set(form.transporterCompanySiret, "isCollectedFor");

      form.transportSegments.forEach(segment => {
        sirets.set(segment.transporterCompanySiret, "isCollectedFor");
      });
      break;
    }
    case Status.RESEALED: {
      sirets.set(
        form.temporaryStorageDetail.transporterCompanySiret,
        "isToCollectFor"
      );
      sirets.set(form.transporterCompanySiret, "isCollectedFor");

      form.transportSegments.forEach(segment => {
        sirets.set(segment.transporterCompanySiret, "isCollectedFor");
      });
      break;
    }
    case Status.RESENT:
    case Status.RECEIVED:
    case Status.ACCEPTED: {
      sirets.set(
        form.recipientIsTempStorage
          ? form.temporaryStorageDetail.destinationCompanySiret
          : form.recipientCompanySiret,
        "isForActionFor"
      );

      sirets.set(
        form.temporaryStorageDetail?.transporterCompanySiret,
        "isCollectedFor"
      );
      sirets.set(form.transporterCompanySiret, "isCollectedFor");

      form.transportSegments.forEach(segment => {
        sirets.set(segment.transporterCompanySiret, "isCollectedFor");
      });
      break;
    }
    case Status.AWAITING_GROUP:
    case Status.GROUPED: {
      sirets.set(
        form.temporaryStorageDetail?.transporterCompanySiret,
        "isCollectedFor"
      );
      sirets.set(form.transporterCompanySiret, "isCollectedFor");

      form.transportSegments.forEach(segment => {
        sirets.set(segment.transporterCompanySiret, "isCollectedFor");
      });
      break;
    }
    case Status.REFUSED:
    case Status.PROCESSED:
    case Status.NO_TRACEABILITY: {
      for (const siret of sirets.keys()) {
        sirets.set(siret, "isArchivedFor");
      }
      break;
    }
    default:
      break;
  }

  for (const [siret, filter] of sirets.entries()) {
    if (siret) {
      where[filter].push(siret);
    }
  }

  return where;
}

function getRecipient(form: FullForm) {
  return form.temporaryStorageDetail?.signedByTransporter
    ? form.temporaryStorageDetail.destinationCompanyName
    : form.recipientCompanyName;
}

function getWaste(form: FullForm) {
  return [form.wasteDetailsCode, form.wasteDetailsName]
    .filter(Boolean)
    .join(" ");
}

/**
 * Convert a BSD from the forms table to Elastic Search's BSD model.
 */
function toBsdElastic(form: FullForm): BsdElastic {
  const where = getWhere(form);
  return {
    id: form.id,
    readableId: form.readableId,
    type: "BSDD",
    emitter: form.emitterCompanyName ?? "",
    recipient: getRecipient(form) ?? "",
    waste: getWaste(form),
    createdAt: form.createdAt.getTime(),
    ...where,
    sirets: Object.values(where).flat()
  };
}

/**
 * Index all BSDs from the forms table.
 */
export async function indexAllForms(
  idx: string,
  { skip = 0 }: { skip?: number } = {}
) {
  const take = 1000;
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

export function indexForm(form: FullForm) {
  return indexBsd(toBsdElastic(form));
}
