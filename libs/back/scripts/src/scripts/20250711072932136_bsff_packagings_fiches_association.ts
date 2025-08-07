import { Prisma } from "@prisma/client";
import Queue, { JobOptions } from "bull";
import { addBsffPackagingsFichesIntervention } from "back";
import { prisma } from "@td/prisma";

// TODO: use logger

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

export const BsffWithFicheInterventionAndPackagingsInclude =
  Prisma.validator<Prisma.BsffInclude>()({
    ficheInterventions: true,
    packagings: true
  });

export type BsffWithFicheInterventionAndPackagings = Prisma.BsffGetPayload<{
  include: typeof BsffWithFicheInterventionAndPackagingsInclude;
}>;

/**
 * TRA-16247: on veut pouvoir associer des fiches d'intervention à des contenants.
 *
 * Jusqu'ici les fiches d'intervention sont associées à un BSFF, mais on veut changer
 * ce paradigme pour à la place les associer à un contenant.
 *
 * Pour migrer les données legacy, pour un BSFF donné, on associe ses fiches d'intervention
 * à tous ses contenants.
 */
const BATCH_SIZE = 10;
export async function run(tx: Prisma.TransactionClient) {
  console.log(">> Run script to associate BSFF fiches to packagings!");

  // On cible les BSFF qui ont au moins 1 contenant et 1 fiche d'intervention
  const where = {
    // Syntaxe prisma: https://github.com/prisma/prisma/discussions/2772#discussioncomment-1712222
    ficheInterventions: { some: {} },
    packagings: { some: {} }
  };

  const count = await tx.bsff.count({ where });
  console.log(`Found ${count} BSFFs`);

  let finished = false;
  let lastId: string | null = null;
  while (!finished) {
    let bsffs: BsffWithFicheInterventionAndPackagings[] = [];
    try {
      // Récupère les BSFF
      bsffs = await tx.bsff.findMany({
        take: BATCH_SIZE,
        skip: 1, // Skip le curseur
        ...(lastId
          ? {
              cursor: {
                id: lastId
              }
            }
          : {}),
        where,
        include: {
          ficheInterventions: true,
          packagings: true
        }
      });

      await Promise.all(
        bsffs.map(async bsff => {
          // Fix fiches & packagings
          await addBsffPackagingsFichesIntervention(
            bsff.packagings,
            bsff.ficheInterventions,
            tx
          );

          // Re-index le BSFF
          enqueueUpdatedBsdToIndex(bsff.id);

          console.log(`Done fixing BSFF ${bsff.id}`);
        })
      );
    } catch (error) {
      console.log(`Failed to fetch bsffs from cursor ${lastId}`);
      console.log(error);
    }

    // Met le curseur à jour
    lastId = bsffs[bsffs.length - 1].id;

    if (bsffs.length < BATCH_SIZE) {
      finished = true;
    }

    if (bsffs.length === 0) {
      break;
    }
  }

  console.log(">> Terminé!");
}
run(prisma);
