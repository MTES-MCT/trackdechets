import { prisma } from "@td/prisma";
import { reindex } from "../../bsds/indexation/reindexBsdHelpers";

// Fine-tune the batch size here
const BATCH_SIZE = 100;

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

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

// Commande: npx tsx --tsconfig back/tsconfig.lib.json back/src/scripts/bin/bsda-final-operation-D9-D9F.ts

async function migrateBsdaFinalOperationCode() {
  console.log(
    "\n=== Migration BsdaFinalOperation operationCode: D 9 → D 9 F ==="
  );

  let updatedFinalOperations = 0;
  let errors = 0;

  const finalOperationsTotal = await prisma.bsdaFinalOperation.count({
    where: { operationCode: "D 9" }
  });

  console.log(
    `Total de ${finalOperationsTotal} BsdaFinalOperation à mettre à jour pour operationCode.`
  );
  console.log("Lancement du script dans 5 secondes...");
  await pause(5000);

  if (finalOperationsTotal === 0) {
    console.log("Aucun BsdaFinalOperation à mettre à jour pour operationCode.");
    return { updated: 0, errors: 0 };
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const finalOperations = await prisma.bsdaFinalOperation.findMany({
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "asc"
      },
      where: {
        operationCode: "D 9"
      },
      select: {
        id: true,
        initialBsdaId: true,
        finalBsdaId: true
      }
    });

    if (finalOperations.length === 0) {
      break;
    }

    const finalOperationIds = finalOperations.map(fo => fo.id);
    // Collect all unique BSDA IDs for reindexing (both initial and final)
    const bsdaIdsToReindex = [
      ...new Set([
        ...finalOperations.map(fo => fo.initialBsdaId),
        ...finalOperations.map(fo => fo.finalBsdaId)
      ])
    ];

    try {
      await prisma.bsdaFinalOperation.updateMany({
        where: { id: { in: finalOperationIds } },
        data: {
          operationCode: "D 9 F"
        }
      });

      // Re-index the associated BSDAAs (both initial and final)
      await Promise.allSettled(
        bsdaIdsToReindex.map(async bsdaId => {
          try {
            await reindex(bsdaId, success => success);
          } catch (_) {
            throw new Error(bsdaId);
          }
        })
      );

      updatedFinalOperations += finalOperations.length;
      console.log(
        `operationCode: ${updatedFinalOperations}/${finalOperationsTotal} mis à jour`
      );
    } catch (e) {
      errors++;
      console.log(
        `/!\\ Erreur operationCode batch ${finalOperationIds.join(", ")}: ${
          e.message
        }`
      );
    }
  }

  return { updated: updatedFinalOperations, errors };
}

(async function () {
  console.log(
    ">> Lancement du script de mise à jour des BsdaFinalOperation: code D 9 devient D 9 F"
  );

  const startDate = new Date();

  // Execute the migration
  const finalOperationResults = await migrateBsdaFinalOperationCode();

  const duration = new Date().getTime() - startDate.getTime();

  console.log("\n=== RÉSUMÉ FINAL ===");
  console.log(
    `BsdaFinalOperation operationCode: ${finalOperationResults.updated} mis à jour, ${finalOperationResults.errors} erreurs`
  );
  console.log(
    `TOTAL: ${finalOperationResults.updated} final operations mis à jour, ${
      finalOperationResults.errors
    } erreurs en ${formatTime(duration)}!`
  );

  console.log("Terminé!");
})().then(() => process.exit());
