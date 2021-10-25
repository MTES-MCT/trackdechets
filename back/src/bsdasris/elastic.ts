import { BsdasriStatus, Bsdasri } from "@prisma/client";
import prisma from "../prisma";
import { BsdElastic, indexBsd, indexBsds } from "../common/elastic";

import { DASRI_WASTE_CODES_MAPPING } from "../common/constants/DASRI_CONSTANTS";
import { GraphQLContext } from "../types";

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

  const formSirets: Record<string, string | null | undefined> = {
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    transporterCompanySiret: bsdasri.transporterCompanySiret
  };

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
  switch (bsdasri.status) {
    case BsdasriStatus.INITIAL: {
      if (bsdasri.isDraft) {
        for (const fieldName of siretsFilters.keys()) {
          setTab(siretsFilters, fieldName, "isDraftFor");
        }
      } else {
        setTab(siretsFilters, "emitterCompanySiret", "isForActionFor");
        setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
      }
      break;
    }

    case BsdasriStatus.SIGNED_BY_PRODUCER: {
      setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
      break;
    }

    case BsdasriStatus.SENT: {
      setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
      setTab(siretsFilters, "transporterCompanySiret", "isCollectedFor");
      break;
    }

    case BsdasriStatus.RECEIVED: {
      setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
      break;
    }

    case BsdasriStatus.REFUSED:
    case BsdasriStatus.PROCESSED: {
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

function getWaste(bsdasri: Bsdasri) {
  return [bsdasri.wasteCode, DASRI_WASTE_CODES_MAPPING[bsdasri.wasteCode]]
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
    recipient: bsdasri.destinationCompanyName ?? "",
    transporterNumberPlate: bsdasri.transporterTransportPlates,
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

export function indexBsdasri(bsdasri: Bsdasri, ctx?: GraphQLContext) {
  return indexBsd(toBsdElastic(bsdasri), ctx);
}
