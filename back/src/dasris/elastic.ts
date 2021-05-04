import { BsdasriStatus, Bsdasri } from "@prisma/client";
import prisma from "../prisma";
import { BsdElastic, indexBsd, indexBsds } from "../common/elastic";

import { DASRI_WASTE_CODES_MAPPING } from "../common/constants/DASRI_CONSTANTS";

// | state              | emitter | transporter | recipient |
// |--------------------|---------|-------------|-----------|
// | initial (draft)    | draft   | draft       | draft     |
// | initial            | action  | to collect  | follow    |
// | signed_by_producer | follow  | to collect  | follow    |
// | sent               | follow  | collected   | action    |
// | received           | follow  | follow      | action    |
// | processed          | archive | archive     | archive   |
// | refused            | archive | archive     | archive   |

function getWhere(
  bsdasri: Bsdasri
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
      bsdasri.emitterCompanySiret,
      bsdasri.recipientCompanySiret,
      bsdasri.transporterCompanySiret
    ].map(siret => [siret, "isFollowFor"])
  );

  switch (bsdasri.status) {
    case BsdasriStatus.INITIAL: {
      if (bsdasri.isDraft) {
        for (const siret of sirets.keys()) {
          sirets.set(siret, "isDraftFor");
        }
      } else {
        sirets.set(bsdasri.emitterCompanySiret, "isForActionFor");
        sirets.set(bsdasri.transporterCompanySiret, "isToCollectFor");
      }
      break;
    }

    case BsdasriStatus.SIGNED_BY_PRODUCER: {
      sirets.set(bsdasri.transporterCompanySiret, "isToCollectFor");
      break;
    }

    case BsdasriStatus.SENT: {
      sirets.set(bsdasri.recipientCompanySiret, "isForActionFor");
      sirets.set(bsdasri.transporterCompanySiret, "isCollectedFor");
      break;
    }

    case BsdasriStatus.RECEIVED: {
      sirets.set(bsdasri.recipientCompanySiret, "isForActionFor");
      break;
    }

    case BsdasriStatus.REFUSED:
    case BsdasriStatus.PROCESSED: {
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

function getWaste(bsdasri: Bsdasri) {
  return [
    bsdasri.wasteDetailsCode,
    DASRI_WASTE_CODES_MAPPING[bsdasri.wasteDetailsCode]
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Convert a dasri from the bsdasri table to Elastic Search's BSD model.
 */
function toBsdElastic(bsdasri: Bsdasri): BsdElastic {
  const where = getWhere(bsdasri);

  return {
    id: bsdasri.id,
    readableId: bsdasri.id,
    type: "BSDASRI",
    emitter: bsdasri.emitterCompanyName ?? "",
    recipient: bsdasri.recipientCompanyName ?? "",
    waste: getWaste(bsdasri),
    createdAt: bsdasri.createdAt.getTime(),
    ...where,
    sirets: Object.values(where).flat()
  };
}

/**
 * Index all BSDs from the forms table.
 */
export async function indexAllBsdasris(
  idx: string,
  { skip = 0 }: { skip?: number } = {}
) {
  const take = 1000;
  const bsdasris = await prisma.bsdasri.findMany({
    skip,
    take,
    where: {
      isDeleted: false
    }
  });

  if (bsdasris.length === 0) {
    return;
  }

  await indexBsds(
    idx,
    bsdasris.map(bsdasri => toBsdElastic(bsdasri))
  );

  if (bsdasris.length < take) {
    // all forms have been indexed
    return;
  }

  return indexAllBsdasris(idx, { skip: skip + take });
}

export function indexBsdasri(bsdasri: Bsdasri) {
  return indexBsd(toBsdElastic(bsdasri));
}
