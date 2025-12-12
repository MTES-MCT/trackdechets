import { prisma } from "@td/prisma";
import Queue, { JobOptions } from "bull";

const { REDIS_URL, NODE_ENV } = process.env;
const INDEX_QUEUE_NAME = `queue_index_elastic_${NODE_ENV}`;
const indexQueue = new Queue<string>(INDEX_QUEUE_NAME, REDIS_URL!, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "fixed", delay: 100 },
    removeOnComplete: 10_000,
    timeout: 10000
  }
});

async function enqueueUpdatedBsdToIndex(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  await indexQueue.add("index_updated", bsdId, options);
}

const BATCH_SIZE = 5000;
const now = new Date();
const twentyMonthsAgo = new Date(now);
twentyMonthsAgo.setMonth(now.getMonth() - 20);
const fourMonthsAgo = new Date(now);
fourMonthsAgo.setMonth(now.getMonth() - 4);

async function processPaginated(
  modelName: string,
  revisionModel: any,
  bsdIdField: string
) {
  let cursor: { createdAt: Date; id: string } | undefined = undefined;
  let totalProcessed = 0;
  let totalReindexed = 0;
  console.log(`\n--- Processing ${modelName} revision requests ---`);

  // Count total revisions concerned
  const totalRevisions = await revisionModel.count({
    where: {
      createdAt: {
        gte: twentyMonthsAgo,
        lte: fourMonthsAgo
      },
      status: { not: "PENDING" }
    }
  });
  console.log(
    `[${modelName}] Total non-pending revision requests in range: ${totalRevisions}`
  );
  if (totalRevisions === 0) {
    console.log(`[${modelName}] No non-pending revision requests to process.`);
    return;
  }

  const startTime = Date.now();
  let batchNum = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    batchNum++;
    const page = await revisionModel.findMany({
      where: {
        createdAt: {
          gte: twentyMonthsAgo,
          lte: fourMonthsAgo
        },
        status: { not: "PENDING" }
      },
      ...(cursor ? { skip: 1, cursor } : {}),
      take: BATCH_SIZE,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, [bsdIdField]: true, createdAt: true }
    });

    if (!page.length) break;

    console.log(
      `[${modelName}] Batch #${batchNum}: Processing ${
        page.length
      } revision requests (from ${totalProcessed + 1} to ${
        totalProcessed + page.length
      } of ${totalRevisions})`
    );

    const batchStart = Date.now();
    for (const revision of page) {
      totalProcessed++;
      const bsdId = revision[bsdIdField];

      if (!bsdId) {
        console.warn(
          `[${modelName}] RevisionRequest ${revision.id} has no BSD id, skipping.`
        );
        continue;
      }

      await enqueueUpdatedBsdToIndex(bsdId);

      totalReindexed++;
      // Stop if we've processed the initial count
      if (totalProcessed >= totalRevisions) {
        break;
      }
    }
    const batchDuration = (Date.now() - batchStart) / 1000;
    const avgPerItem = batchDuration / page.length;
    const remaining = totalRevisions - totalProcessed;
    const estRemainingSec = Math.round(avgPerItem * remaining);
    const estRemainingMin = Math.floor(estRemainingSec / 60);
    const estRemainingSecDisplay = estRemainingSec % 60;
    console.log(
      `[${modelName}] Batch #${batchNum} done in ${batchDuration.toFixed(
        1
      )}s. Estimated time left: ${estRemainingMin}m${estRemainingSecDisplay}s for ${remaining} items.`
    );

    // Use composite cursor for next batch (newest to oldest)
    const last = page[page.length - 1];
    cursor = { createdAt: last.createdAt, id: last.id };
    if (page.length < BATCH_SIZE) break;
    if (totalProcessed >= totalRevisions) break;
  }
  const totalDuration = (Date.now() - startTime) / 1000;
  console.log(
    `[${modelName}] Processed: ${totalProcessed}, Re-indexed: ${totalReindexed}, Total time: ${Math.floor(
      totalDuration / 60
    )}m${Math.round(totalDuration % 60)}s.`
  );
}

export async function run() {
  console.log(
    "Starting re-indexation of BSDs with revision requests between 20 and 4 months ago..."
  );
  await processPaginated("BSDD", prisma.bsddRevisionRequest, "bsddId");
  await processPaginated("BSDA", prisma.bsdaRevisionRequest, "bsdaId");
  await processPaginated("BSDASRI", prisma.bsdasriRevisionRequest, "bsdasriId");
  console.log("Re-indexation script completed.");
}

// To run: import and call run() from your runner
