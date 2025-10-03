import { prisma } from "@td/prisma";
import { reindex } from "../../bsds/indexation/reindexBsdHelpers";

// Estimated count in production: 12

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

// Commande: npx tsx --tsconfig back/tsconfig.lib.json back/src/scripts/bin/bsda-revision-request-D9-D9F.ts

async function migrateBsdaRevisionRequestOperationCode() {
  console.log(
    "\n=== Migration BsdaRevisionRequest destinationOperationCode: D 9 → D 9 F + mode ELIMINATION ==="
  );

  let updatedRevisionRequests = 0;
  let errors = 0;

  const revisionRequestsTotal = await prisma.bsdaRevisionRequest.count({
    where: { destinationOperationCode: "D 9" }
  });

  console.log(
    `Total de ${revisionRequestsTotal} BsdaRevisionRequest à mettre à jour pour destinationOperationCode.`
  );
  console.log("Lancement du script dans 5 secondes...");
  await pause(5000);

  if (revisionRequestsTotal === 0) {
    console.log(
      "Aucun BsdaRevisionRequest à mettre à jour pour destinationOperationCode."
    );
    return { updated: 0, errors: 0 };
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const revisionRequests = await prisma.bsdaRevisionRequest.findMany({
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "asc"
      },
      where: {
        destinationOperationCode: "D 9"
      },
      select: {
        id: true,
        bsdaId: true
      }
    });

    if (revisionRequests.length === 0) {
      break;
    }

    const revisionRequestIds = revisionRequests.map(rr => rr.id);
    const bsdaIds = [...new Set(revisionRequests.map(rr => rr.bsdaId))]; // Unique BSDA IDs for reindexing

    try {
      await prisma.bsdaRevisionRequest.updateMany({
        where: { id: { in: revisionRequestIds } },
        data: {
          destinationOperationCode: "D 9 F",
          destinationOperationMode: "ELIMINATION"
        }
      });

      // Re-index the associated BSDAAs
      await Promise.allSettled(
        bsdaIds.map(async bsdaId => {
          try {
            await reindex(bsdaId, success => success);
          } catch (_) {
            throw new Error(bsdaId);
          }
        })
      );

      updatedRevisionRequests += revisionRequests.length;
      console.log(
        `destinationOperationCode: ${updatedRevisionRequests}/${revisionRequestsTotal} mis à jour`
      );
    } catch (e) {
      errors++;
      console.log(
        `/!\\ Erreur destinationOperationCode batch ${revisionRequestIds.join(
          ", "
        )}: ${e.message}`
      );
    }
  }

  return { updated: updatedRevisionRequests, errors };
}

(async function () {
  console.log(
    ">> Lancement du script de mise à jour des BsdaRevisionRequest: code D 9 devient D 9 F + mode ELIMINATION"
  );

  const startDate = new Date();

  // Execute the migration
  const revisionResults = await migrateBsdaRevisionRequestOperationCode();

  const duration = new Date().getTime() - startDate.getTime();

  console.log("\n=== RÉSUMÉ FINAL ===");
  console.log(
    `BsdaRevisionRequest destinationOperationCode: ${revisionResults.updated} mis à jour, ${revisionResults.errors} erreurs`
  );
  console.log(
    `TOTAL: ${revisionResults.updated} revision requests mis à jour, ${
      revisionResults.errors
    } erreurs en ${formatTime(duration)}!`
  );

  console.log("Terminé!");
})().then(() => process.exit());
