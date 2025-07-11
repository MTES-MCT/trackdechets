import { Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import Queue, { JobOptions } from "bull";

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
export async function run() {
  console.log(">> Run script to associate BSFF fiches to packagings!");

  let finished = false;
  let lastId: string | null = null;
  while (!finished) {
    let bsffs: BsffWithFicheInterventionAndPackagings[] = [];
    try {
      // Fetch all the bsffs
      bsffs = await prisma.bsff.findMany({
        take: BATCH_SIZE,
        skip: 1, // Skip the cursor
        ...(lastId
          ? {
              cursor: {
                id: lastId
              }
            }
          : {}),
        include: {
          ficheInterventions: true,
          packagings: true
        }
      });

      await Promise.all(
        bsffs.map(async bsff => {
          // Fix fiches & packagings
          await Promise.all(
            bsff.ficheInterventions.map(async fiche => {
              await Promise.all(
                bsff.packagings.map(async packaging => {
                  // Could fail if ficheId / packagingId tuple already exists in DB
                  try {
                    await prisma.bsffPackagingToBsffFicheIntervention.create({
                      data: {
                        ficheInterventionId: fiche.id,
                        packagingId: packaging.id
                      }
                    });

                    console.log(
                      `Done creating record for ficheInterventionId('${fiche.id}')/packagingId('${packaging.id}')`
                    );
                  } catch (error) {
                    // Duplicate record. Ignore
                    if (
                      error instanceof Prisma.PrismaClientKnownRequestError &&
                      error.code === "P2002"
                    ) {
                      // Ignore
                      console.log(
                        `Record already existing for ficheInterventionId('${fiche.id}')/packagingId('${packaging.id}')`
                      );
                    } else {
                      console.log(
                        `Failed to create record for ficheInterventionId('${fiche.id}')/packagingId('${packaging.id}')`
                      );
                      console.log(error);
                    }
                  }
                })
              );
            })
          );

          // Re-index bsff
          enqueueUpdatedBsdToIndex(bsff.id);

          console.log(`Done fixing BSFF ${bsff.id}`);
        })
      );
    } catch (error) {
      console.log(`Failed to fetch bsffs from cursor ${lastId}`);
      console.log(error);
    }

    // Update cursor
    lastId = bsffs[bsffs.length - 1].id;

    if (bsffs.length < BATCH_SIZE) {
      finished = true;
    }

    if (bsffs.length === 0) {
      break;
    }
  }

  console.log(">> Done!");
}
