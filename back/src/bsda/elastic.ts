import { Bsda, BsdaStatus } from "@prisma/client";
import { BsdElastic, indexBsd, indexBsds } from "../common/elastic";
import prisma from "../prisma";

// | state              | emitter          | worker           | transporter | destination      |
// |--------------------|------------------|------------------|-------------|------------------|
// | INITIAL (draft)    | draft            | draft            | draft       | draft            |
// | INITIAL            | action | follow  | follow | action  | follow      | follow | action  |
// | SIGNED_BY_PRODUCER | follow           | action           | follow      | follow           |
// | SIGNED_BY_WORKER   | follow           | follow           | to collect  | follow           |
// | SENT               | follow           | follow           | collected   | action           |
// | PROCESSED          | archive          | archive          | archive     | archive          |
// | REFUSED            | archive          | archive          | archive     | archive          |
// | AWAITING_CHILD     | follow           | follow           | follow      | follow           |
function getWhere(
  bsda: Bsda
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
    emitterCompanySiret: bsda.emitterCompanySiret,
    workerCompanySiret: bsda.workerCompanySiret,
    destinationCompanySiret: bsda.destinationCompanySiret,
    transporterCompanySiret: bsda.transporterCompanySiret
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

  switch (bsda.status) {
    case BsdaStatus.INITIAL:
      if (bsda.isDraft) {
        for (const fieldName of siretsFilters.keys()) {
          setTab(siretsFilters, fieldName, "isDraftFor");
        }
        break;
      }
      if (bsda.type === "COLLECTION_2710") {
        setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
        break;
      }
      if (bsda.workerWorkHasEmitterPaperSignature) {
        setTab(siretsFilters, "workerCompanySiret", "isForActionFor");
        break;
      }
      setTab(siretsFilters, "emitterCompanySiret", "isForActionFor");
      break;

    case BsdaStatus.SIGNED_BY_PRODUCER:
      setTab(siretsFilters, "workerCompanySiret", "isForActionFor");
      break;

    case BsdaStatus.SIGNED_BY_WORKER:
      setTab(siretsFilters, "transporterCompanySiret", "isToCollectFor");
      break;

    case BsdaStatus.SENT:
      setTab(siretsFilters, "destinationCompanySiret", "isForActionFor");
      setTab(siretsFilters, "transporterCompanySiret", "isCollectedFor");
      break;

    case BsdaStatus.REFUSED:
    case BsdaStatus.PROCESSED:
      for (const fieldName of siretsFilters.keys()) {
        setTab(siretsFilters, fieldName, "isArchivedFor");
      }
      break;

    case BsdaStatus.AWAITING_CHILD:
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

function getWaste(bsda: Bsda) {
  return [bsda.wasteName, bsda.wasteMaterialName, bsda.wasteCode]
    .filter(Boolean)
    .join(", ");
}

function toBsdElastic(bsda: Bsda): BsdElastic {
  const where = getWhere(bsda);

  return {
    id: bsda.id,
    readableId: bsda.id,
    type: "BSDA",
    emitter: bsda.emitterCompanyName ?? "",
    recipient: bsda.destinationCompanyName ?? "",
    waste: getWaste(bsda),
    createdAt: bsda.createdAt.getTime(),
    ...where,
    sirets: Object.values(where).flat()
  };
}

export async function indexAllBsdas(
  idx: string,
  { skip = 0 }: { skip?: number } = {}
) {
  const take = 1000;
  const bsdas = await prisma.bsda.findMany({
    skip,
    take,
    where: {
      isDeleted: false
    }
  });

  if (bsdas.length === 0) {
    return;
  }

  await indexBsds(
    idx,
    bsdas.map(bsda => toBsdElastic(bsda))
  );

  if (bsdas.length < take) {
    return;
  }

  return indexAllBsdas(idx, { skip: skip + take });
}

export function indexBsda(bsda: Bsda) {
  return indexBsd(toBsdElastic(bsda));
}
