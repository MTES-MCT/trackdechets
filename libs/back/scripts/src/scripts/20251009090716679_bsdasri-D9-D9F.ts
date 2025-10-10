import { prisma } from "@td/prisma";
import { logger } from "@td/logger";
import Queue, { JobOptions } from "bull";

// TRA-16750: Migration des codes D9 vers D9F dans les BSDA & BSDASRI

// Estimated count in production: 371 447

// Fine-tune the batch size here
const BATCH_SIZE = 1000;

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

const formatTime = milliseconds => {
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / 1000 / 60) % 60);
  const hours = Math.floor((milliseconds / 1000 / 60 / 60) % 24);

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0")
  ].join(":");
};

export async function run() {
  console.log(
    ">> Lancement du script de mise à jour des BSDASRI: code D9 devient D9F, avec mode = ELIMINATION"
  );

  let updatedBsdasris = 0;
  let errors = 0;
  let lastProcessedRowNumber = 0;

  const startDate = new Date();

  const bsdasrisTotal = await prisma.bsdasri.count({
    where: { destinationOperationCode: "D9" }
  });

  console.log(`Total de ${bsdasrisTotal} BSDASRI à mettre à jour.`);

  // Phase 1: Cursor-based processing for performance
  console.log("Phase 1: Traitement par curseur...");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Use cursor to continue from where we left off - much faster!
    const bsdasris = await prisma.bsdasri.findMany({
      take: BATCH_SIZE,
      orderBy: {
        rowNumber: "asc"
      },
      where: {
        destinationOperationCode: "D9",
        rowNumber: {
          gt: lastProcessedRowNumber // Continue from last processed row
        }
      },
      select: {
        id: true,
        rowNumber: true
      }
    });

    if (bsdasris.length === 0) {
      break;
    }

    const bsdIds = bsdasris.map(bsdasri => bsdasri.id);

    try {
      // Update in DB
      await prisma.bsdasri.updateMany({
        where: { id: { in: bsdIds } },
        data: {
          destinationOperationCode: "D9F",
          destinationOperationMode: "ELIMINATION"
        }
      });

      // Re-index
      await Promise.allSettled(
        bsdIds.map(async bsdId => {
          try {
            // await enqueueUpdatedBsdToIndex(bsdId);
          } catch (_) {
            throw new Error(`Could not enqueue BSD ${bsdId}`);
          }
        })
      );

      // Update cursor to continue from the last processed row
      lastProcessedRowNumber = Math.max(...bsdasris.map(b => b.rowNumber));
    } catch (e) {
      errors++;

      console.log(`/!\\ Erreur for batch ${bsdIds.join(", ")}: ${e.message}`);
    }

    updatedBsdasris += bsdIds.length;

    const loopDuration = new Date().getTime() - startDate.getTime();
    console.log(
      `${updatedBsdasris} bsdasris mis à jour (${Math.round(
        (updatedBsdasris / bsdasrisTotal) * 100
      )}%) en ${formatTime(loopDuration)} (temps total estimé: ${formatTime(
        (loopDuration / updatedBsdasris) * bsdasrisTotal
      )})`
    );
  }

  // Phase 2: Final verification to catch any records that might have been missed or updated during execution
  console.log("\nPhase 2: Vérification finale...");
  let remainingCount = await prisma.bsdasri.count({
    where: { destinationOperationCode: "D9" }
  });

  if (remainingCount > 0) {
    console.log(
      `⚠️  ${remainingCount} BSDASRI avec D9 trouvés lors de la vérification finale. Traitement...`
    );

    // Process remaining records using the original method (slower but comprehensive)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const remainingBsdasris = await prisma.bsdasri.findMany({
        take: BATCH_SIZE,
        orderBy: { rowNumber: "asc" },
        where: { destinationOperationCode: "D9" },
        select: { id: true }
      });

      if (remainingBsdasris.length === 0) {
        break;
      }

      const remainingIds = remainingBsdasris.map(b => b.id);

      try {
        await prisma.bsdasri.updateMany({
          where: { id: { in: remainingIds } },
          data: {
            destinationOperationCode: "D9F",
            destinationOperationMode: "ELIMINATION"
          }
        });

        await Promise.allSettled(
          remainingIds.map(async bsdId => {
            try {
              // await enqueueUpdatedBsdToIndex(bsdId);
            } catch (_) {
              console.log(`Erreur re-indexation finale: ${bsdId}`);
            }
          })
        );

        updatedBsdasris += remainingIds.length;
        console.log(`Vérification finale: +${remainingIds.length} traités`);
      } catch (e) {
        errors++;
        console.log(`/!\\ Erreur vérification finale: ${e.message}`);
      }
    }

    // Final count check
    remainingCount = await prisma.bsdasri.count({
      where: { destinationOperationCode: "D9" }
    });
  }

  const duration = new Date().getTime() - startDate.getTime();

  console.log(`\n=== RÉSUMÉ FINAL ===`);
  console.log(
    `✅ ${updatedBsdasris} bsdasris mis à jour, ${errors} erreurs en ${formatTime(
      duration
    )}`
  );
  console.log(
    `🔍 Vérification finale: ${remainingCount} records avec D9 restants`
  );

  if (remainingCount === 0) {
    console.log("🎉 Migration terminée avec succès!");
  } else {
    console.log(
      `⚠️  ${remainingCount} records nécessitent une attention manuelle`
    );
  }
}
