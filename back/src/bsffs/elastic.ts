import { Bsff, BsffStatus } from "@prisma/client";
import prisma from "../prisma";
import { BsdElastic, indexBsd, indexBsds } from "../common/elastic";
import { GraphQLContext } from "../types";

function toBsdElastic(bsff: Bsff): BsdElastic {
  const bsd = {
    id: bsff.id,
    readableId: bsff.id,
    type: "BSFF" as const,
    emitter: bsff.emitterCompanyName ?? "",
    recipient: bsff.destinationCompanyName ?? "",
    waste: [bsff.wasteCode, bsff.wasteDescription].filter(Boolean).join(" "),
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

  if (bsff.isDraft) {
    bsd.isDraftFor.push(
      bsff.emitterCompanySiret,
      bsff.transporterCompanySiret,
      bsff.destinationCompanySiret
    );
  } else {
    switch (bsff.status) {
      case BsffStatus.INITIAL: {
        bsd.isForActionFor.push(bsff.emitterCompanySiret);
        bsd.isFollowFor.push(
          bsff.transporterCompanySiret,
          bsff.destinationCompanySiret
        );
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
        bsd.isFollowFor.push(bsff.emitterCompanySiret);
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
        break;
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

export function indexBsff(form: Bsff, ctx?: GraphQLContext) {
  return indexBsd(toBsdElastic(form), ctx);
}
