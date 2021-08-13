import { Bsff, BsffStatus } from "@prisma/client";
import prisma from "../prisma";
import { BsdElastic, indexBsd, indexBsds } from "../common/elastic";

function toBsdElastic(bsff: Bsff): BsdElastic {
  const bsd = {
    id: bsff.id,
    readableId: bsff.id,
    type: "BSFF" as const,
    emitter: bsff.emitterCompanyName ?? "",
    recipient: bsff.destinationCompanyName ?? "",
    waste: [bsff.wasteCode, bsff.wasteNature].filter(Boolean).join(" "),
    createdAt: bsff.createdAt.getTime(),
    isDraftFor: [],
    isForActionFor: [],
    isFollowFor: [],
    isArchivedFor: [],
    isToCollectFor: [],
    isCollectedFor: [],
    sirets: [
      bsff.emitterCompanySiret,
      bsff.transporterCompanySiret,
      bsff.destinationCompanySiret
    ]
  };

  switch (bsff.status) {
    case BsffStatus.INITIAL: {
      bsd.isDraftFor.push(
        bsff.emitterCompanySiret,
        bsff.transporterCompanySiret,
        bsff.destinationCompanySiret
      );
      bsd.isForActionFor.push(bsff.emitterCompanySiret);
      bsd.isToCollectFor.push(bsff.transporterCompanySiret);
      break;
    }
    case BsffStatus.SIGNED_BY_EMITTER: {
      bsd.isToCollectFor.push(bsff.transporterCompanySiret);
      bsd.isFollowFor.push(
        bsff.emitterCompanySiret,
        bsff.destinationCompanySiret
      );
      break;
    }
    case BsffStatus.SENT: {
      bsd.isCollectedFor.push(bsff.transporterCompanySiret);
      bsd.isFollowFor.push(
        bsff.emitterCompanySiret,
        bsff.transporterCompanySiret
      );
      bsd.isForActionFor.push(bsff.destinationCompanySiret);
      break;
    }
    case BsffStatus.RECEIVED: {
      bsd.isFollowFor.push(
        bsff.emitterCompanySiret,
        bsff.transporterCompanySiret
      );
      bsd.isForActionFor.push(bsff.destinationCompanySiret);
      break;
    }
    case BsffStatus.INTERMEDIATELY_PROCESSED: {
      bsd.isFollowFor.push(
        bsff.emitterCompanySiret,
        bsff.transporterCompanySiret,
        bsff.destinationCompanySiret
      );
    }
    case BsffStatus.REFUSED:
    case BsffStatus.PROCESSED: {
      bsd.isArchivedFor.push(
        bsff.emitterCompanySiret,
        bsff.transporterCompanySiret,
        bsff.destinationCompanySiret
      );
      break;
    }
    default:
      break;
  }

  return bsd;
}

export async function indexAllBsffs(
  idx: string,
  { skip = 0 }: { skip?: number } = {}
) {
  const take = 1000;
  const bsffs = await prisma.bsff.findMany({
    skip,
    take,
    where: {
      isDeleted: false
    }
  });

  if (bsffs.length === 0) {
    return;
  }

  await indexBsds(
    idx,
    bsffs.map(form => toBsdElastic(form))
  );

  if (bsffs.length < take) {
    // all forms have been indexed
    return;
  }

  return indexAllBsffs(idx, { skip: skip + take });
}

export function indexBsff(form: Bsff) {
  return indexBsd(toBsdElastic(form));
}
