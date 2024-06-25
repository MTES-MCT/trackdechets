import { Prisma } from "@prisma/client";
import {
  getBsdaFromActivityEvents,
  getBsddFromActivityEvents,
  getBsdasriFromActivityEvents
} from "back";

export async function run(tx: Prisma.TransactionClient) {
  // BSDAs - around 20K
  console.info("Starting to process BSDAs...");
  const bsdaRevisionsToFill = await tx.bsdaRevisionRequest.findMany({
    where: { bsdaSnapshot: { equals: Prisma.AnyNull } },
    select: { id: true, bsdaId: true, createdAt: true }
  });

  for (const revision of bsdaRevisionsToFill) {
    const currentBsda = await tx.bsda.findUniqueOrThrow({
      where: { id: revision.bsdaId },
      include: { transporters: true }
    });

    const bsdaFromEvents = await getBsdaFromActivityEvents({
      bsdaId: revision.bsdaId,
      at: revision.createdAt
    });
    const bsdaSnapshot = {
      ...currentBsda,
      ...bsdaFromEvents
    };

    await tx.bsdaRevisionRequest.update({
      where: { id: revision.id },
      data: { bsdaSnapshot }
    });
  }

  // BSDDs - around 45K
  console.info("Starting to process BSDDs...");
  const bsddRevisionsToFill = await tx.bsddRevisionRequest.findMany({
    where: { bsddSnapshot: { equals: Prisma.AnyNull } },
    select: { id: true, bsddId: true, createdAt: true }
  });

  for (const revision of bsddRevisionsToFill) {
    const currentBsdd = await tx.form.findUniqueOrThrow({
      where: { id: revision.bsddId },
      include: {
        forwardedIn: { include: { transporters: true } },
        transporters: true
      }
    });

    const bsddFromEvents = await getBsddFromActivityEvents({
      bsddId: revision.bsddId,
      at: revision.createdAt
    });

    const bsddSnapshot = {
      ...currentBsdd,
      ...bsddFromEvents,
      forwardedIn: currentBsdd.forwardedIn,
      transporters: currentBsdd.transporters
    };

    await tx.bsddRevisionRequest.update({
      where: { id: revision.id },
      data: { bsddSnapshot }
    });
  }

  // BSDasris - around 3K
  console.info("Starting to process BSDasris...");
  const bsdasrisRevisionsToFill = await tx.bsdasriRevisionRequest.findMany({
    where: { bsdasriSnapshot: { equals: Prisma.AnyNull } },
    select: { id: true, bsdasriId: true, createdAt: true }
  });

  for (const revision of bsdasrisRevisionsToFill) {
    const currentBsdasri = await tx.form.findUniqueOrThrow({
      where: { id: revision.bsdasriId },
      include: {
        forwardedIn: { include: { transporters: true } },
        transporters: true
      }
    });

    const bsdasriFromEvents = await getBsdasriFromActivityEvents({
      bsdasriId: revision.bsdasriId,
      at: revision.createdAt
    });
    const bsdasriSnapshot = {
      ...currentBsdasri,
      ...bsdasriFromEvents
    };

    await tx.bsdasriRevisionRequest.update({
      where: { id: revision.id },
      data: { bsdasriSnapshot }
    });
  }
}
