import { prisma } from "@td/prisma";
import { reindex } from "../../bsds/indexation/reindexBsdHelpers";

// Estimated count in production: 0

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

// Commande: npx tsx --tsconfig back/tsconfig.lib.json back/src/scripts/bin/bsdasri-final-operation-D9-D9F.ts

async function migrateBsdasriFinalOperationCode() {
  console.log(
    "\n=== Migration BsdasriFinalOperation operationCode: D9 → D9F ==="
  );

  let updatedFinalOperations = 0;
  let errors = 0;

  const finalOperationsTotal = await prisma.bsdasriFinalOperation.count({
    where: { operationCode: "D9" }
  });

  console.log(
    `Total de ${finalOperationsTotal} BsdasriFinalOperation à mettre à jour pour operationCode.`
  );
  console.log("Lancement du script dans 5 secondes...");
  await pause(5000);

  if (finalOperationsTotal === 0) {
    console.log(
      "Aucun BsdasriFinalOperation à mettre à jour pour operationCode."
    );
    return { updated: 0, errors: 0 };
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const finalOperations = await prisma.bsdasriFinalOperation.findMany({
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "asc"
      },
      where: {
        operationCode: "D9"
      },
      select: {
        id: true,
        initialBsdasriId: true,
        finalBsdasriId: true
      }
    });

    if (finalOperations.length === 0) {
      break;
    }

    const finalOperationIds = finalOperations.map(fo => fo.id);
    // Collect all unique BSDASRI IDs for reindexing (both initial and final)
    const bsdasriIdsToReindex = [
      ...new Set([
        ...finalOperations.map(fo => fo.initialBsdasriId),
        ...finalOperations.map(fo => fo.finalBsdasriId)
      ])
    ];

    try {
      await prisma.bsdasriFinalOperation.updateMany({
        where: { id: { in: finalOperationIds } },
        data: {
          operationCode: "D9F"
        }
      });

      // Re-index the associated BSDASRI (both initial and final)
      await Promise.allSettled(
        bsdasriIdsToReindex.map(async bsdasriId => {
          try {
            await reindex(bsdasriId, success => success);
          } catch (_) {
            throw new Error(bsdasriId);
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
    ">> Lancement du script de mise à jour des BsdasriFinalOperation: code D9 devient D9F"
  );

  const startDate = new Date();

  // Execute the migration
  const finalOperationResults = await migrateBsdasriFinalOperationCode();

  const duration = new Date().getTime() - startDate.getTime();

  console.log("\n=== RÉSUMÉ FINAL ===");
  console.log(
    `BsdasriFinalOperation operationCode: ${finalOperationResults.updated} mis à jour, ${finalOperationResults.errors} erreurs`
  );
  console.log(
    `TOTAL: ${finalOperationResults.updated} final operations mis à jour, ${
      finalOperationResults.errors
    } erreurs en ${formatTime(duration)}!`
  );

  console.log("Terminé!");
})().then(() => process.exit());
