import { prisma } from "@td/prisma";
import { reindex } from "../../bsds/indexation/reindexBsdHelpers";
import { BsvhuStatus } from "@prisma/client";

// Environ 100 VHUs concernés en production
// Commande: npx tsx --tsconfig back/tsconfig.lib.json back/src/scripts/bin/reindexReceivedVHUs.ts

(async function () {
  console.log(
    ">> Lancement du script de réindexation des VHU au statut RECEIVED"
  );

  const where = {
    status: BsvhuStatus.RECEIVED
  };

  const vhusCount = await prisma.bsvhu.count({
    where
  });

  console.log(`${vhusCount} VHUs trouvés avec le statut RECEIVED`);

  const vhus = await prisma.bsvhu.findMany({
    where,
    select: {
      id: true
    }
  });

  await Promise.allSettled(
    vhus.map(async vhu => {
      try {
        await reindex(vhu.id, success => success);
      } catch (_) {
        throw new Error(`Erreur pour le VHU ${vhu.id}`);
      }
    })
  );

  console.log("Terminé!");
})().then(() => process.exit());
