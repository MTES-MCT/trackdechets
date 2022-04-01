import { BsvhuStatus, Bsvhu } from "@prisma/client";
import prisma from "../prisma";
import { BsdElastic, indexBsd, indexBsds } from "../common/elastic";
import { GraphQLContext } from "../types";
import { getRegistryFields } from "./registry";

// | state              | emitter | transporter | destination |
// |--------------------|---------|-------------|-------------|
// | initial (draft)    | draft   | draft       | draft       |
// | initial            | action  | to collect  | follow      |
// | signed_by_producer | follow  | to collect  | follow      |
// | sent               | follow  | collected   | action      |
// | processed          | archive | archive     | archive     |
// | refused            | archive | archive     | archive     |

function getWhere(
  bsvhu: Bsvhu
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
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    transporterCompanySiret: bsvhu.transporterCompanySiret
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

  switch (bsvhu.status) {
    case BsvhuStatus.INITIAL: {
      if (bsvhu.isDraft) {
        for (const fieldName of siretsFilters.keys()) {
          setTab(siretsFilters, fieldName, "isDraftFor");
        }
      } else {
        setTab(siretsFilters, "emitterCompanySiret", "isForActionFor");
        setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
      }
      break;
    }

    case BsvhuStatus.SIGNED_BY_PRODUCER: {
      setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
      break;
    }

    case BsvhuStatus.SENT: {
      setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
      setTab(siretsFilters, "transporterCompanySiret", "isCollectedFor");
      break;
    }

    case BsvhuStatus.REFUSED:
    case BsvhuStatus.PROCESSED: {
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

/**
 * Convert a dasri from the bsvhu table to Elastic Search's BSD model.
 */
function toBsdElastic(bsvhu: Bsvhu): BsdElastic {
  const where = getWhere(bsvhu);

  return {
    type: "BSVHU",
    id: bsvhu.id,
    readableId: bsvhu.id,
    customId: "",
    createdAt: bsvhu.createdAt.getTime(),
    emitterCompanyName: bsvhu.emitterCompanyName ?? "",
    emitterCompanySiret: bsvhu.emitterCompanySiret ?? "",
    transporterCompanyName: bsvhu.transporterCompanyName ?? "",
    transporterCompanySiret: bsvhu.transporterCompanySiret ?? "",
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt?.getTime(),
    destinationCompanyName: bsvhu.destinationCompanyName ?? "",
    destinationCompanySiret: bsvhu.destinationCompanySiret ?? "",
    destinationReceptionDate: bsvhu.destinationReceptionDate?.getTime(),
    destinationReceptionWeight: bsvhu.destinationReceptionWeight,
    destinationOperationCode: bsvhu.destinationOperationCode ?? "",
    destinationOperationDate: bsvhu.destinationOperationDate?.getTime(),
    wasteCode: bsvhu.wasteCode ?? "",
    wasteDescription: "",
    ...where,
    sirets: Object.values(where).flat(),
    ...getRegistryFields(bsvhu)
  };
}

/**
 * Index all Forms from the vhu table.
 */
export async function indexAllBsvhus(
  idx: string,
  { skip = 0 }: { skip?: number } = {}
) {
  const take = 500;
  const bsvhus = await prisma.bsvhu.findMany({
    skip,
    take,
    where: {
      isDeleted: false
    }
  });

  if (bsvhus.length === 0) {
    return;
  }

  await indexBsds(
    idx,
    bsvhus.map(bsvhu => toBsdElastic(bsvhu))
  );

  if (bsvhus.length < take) {
    // all forms have been indexed
    return;
  }

  return indexAllBsvhus(idx, { skip: skip + take });
}

export function indexBsvhu(bsvhu: Bsvhu, ctx?: GraphQLContext) {
  return indexBsd(toBsdElastic(bsvhu), ctx);
}
