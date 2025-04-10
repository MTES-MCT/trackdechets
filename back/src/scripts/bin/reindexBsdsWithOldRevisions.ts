import { cleanUpIsRevisedForTab } from "../../common/elasticHelpers";

// Commande: npx tsx --tsconfig back/tsconfig.lib.json back/src/scripts/bin/reindexBsdsWithOldRevisions.ts

(async function () {
  console.log(
    ">> Lancement du script de réindexation des BSDs avec de vieilles révisions"
  );

  // ===============================================================
  // ======================== BSDD =================================
  // ===============================================================

  await cleanUpIsRevisedForTab();

  console.log("Terminé!");
})().then(() => process.exit());
