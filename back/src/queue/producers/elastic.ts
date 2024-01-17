import Queue, { JobOptions } from "bull";
import { logger } from "@td/logger";
import { scheduleWebhook } from "./webhooks";
import {
  INDEX_JOB_NAME,
  INDEX_CREATED_JOB_NAME,
  INDEX_UPDATED_JOB_NAME,
  DELETE_JOB_NAME
} from "./jobNames";
import { updatesQueue } from "./bsdUpdate";
import { updateFavorites } from "../../companies/database";

const { REDIS_URL, NODE_ENV } = process.env;
export const INDEX_QUEUE_NAME = `queue_index_elastic_${NODE_ENV}`;

export const indexQueue = new Queue<string>(INDEX_QUEUE_NAME, REDIS_URL!, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "fixed", delay: 100 },
    removeOnComplete: 10_000,
    timeout: 10000
  }
});

// On gère l'indexation en bulk dans une queue et un worker séparée afin de
// ne pas bloquer les jobs d'indexation "courants" lors d'un réindex
// global
export const BULK_INDEX_QUEUE_NAME = `queue_bulk_index_elastic_${NODE_ENV}`;

export const bulkIndexQueue = new Queue<string>(
  BULK_INDEX_QUEUE_NAME,
  REDIS_URL!,
  {
    defaultJobOptions: {
      // un seul essai pour chaque chunk histoire de ne pas bloquer les autres trop longtemps
      // s'il y a un problème avec une chunk, on garde la possibilité de retry à la mano depuis
      // le dashboard bull
      attempts: 1,
      backoff: { type: "fixed", delay: 100 },
      removeOnComplete: 10_000,
      // timeout d'1 minute  pour prendre de la marge
      timeout: 60000
    }
  }
);

// Cette queue permet de process le job qui enqueue toutes les chunks et attend qu'elles soient
// toutes terminées pour lancer un rattrapage (Cf fonction indexAllBsdTypeConcurrentJobs).
// Elle est également démarré sur un worker séparé pour l'isoler du reste et éviter que le job soit
// relancé en cas de crash d'un worker de bulk indexation
export const BULK_INDEX_MASTER_QUEUE_NAME = `queue_bulk_index_master_elastic_${NODE_ENV}`;

export const bulkIndexMasterQueue = new Queue<string>(
  BULK_INDEX_MASTER_QUEUE_NAME,
  REDIS_URL!,
  {
    defaultJobOptions: {
      attempts: 1,
      backoff: { type: "fixed", delay: 100 },
      removeOnComplete: 10_000,
      // 24h pour prendre de la marge, les jobs de cette queue attendent que toutes les chunks
      // soit process lors d'un reindex global
      timeout: 24 * 3600 * 1000
    }
  }
);

indexQueue.on("completed", async job => {
  const id = job.data;

  const { sirets, siretsBeforeUpdate, status } = job.returnvalue;

  if (
    [
      DELETE_JOB_NAME,
      INDEX_JOB_NAME,
      INDEX_CREATED_JOB_NAME,
      INDEX_UPDATED_JOB_NAME
    ].includes(job.name)
  ) {
    // aggregate and deduplicate sirets to notify relevant recipients
    const orgIdsToNotify = Array.from(
      new Set([...sirets, ...(siretsBeforeUpdate ?? [])])
    );

    updatesQueue.add({ sirets: orgIdsToNotify, id, jobName: job.name });
    scheduleWebhook(id, orgIdsToNotify, job.name);

    // exclude favorites indexation for other statuses
    if (!["SENT", "RESENT"].includes(status)) {
      return;
    }
    // après qu'un BSD soit mis à jour et indexé dans l'index `bsds`
    // on doit mettre à jour le cache des `favorites` pour chaque orgId
    // présent dansd ce BSD afin qu'en tant qu'éditeur dans le futur on lui
    // propose les favoris pré-calculés.

    await updateFavorites(orgIdsToNotify);
  }
});

indexQueue.on("failed", (job, err) => {
  const id = job.data;
  logger.error(`Indexation job failed for bsd "${id}"`, { id, err });
});

type JobName = typeof INDEX_CREATED_JOB_NAME | typeof INDEX_UPDATED_JOB_NAME;

async function enqueueBsdToIndex(
  bsdId: string,
  jobName: JobName,
  options?: JobOptions
): Promise<void> {
  logger.info(`Enqueuing BSD ${bsdId} for indexation`);
  await indexQueue.add(jobName, bsdId, options);
}

export async function enqueueCreatedBsdToIndex(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  await enqueueBsdToIndex(bsdId, INDEX_CREATED_JOB_NAME, options);
}

export async function enqueueUpdatedBsdToIndex(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  await enqueueBsdToIndex(bsdId, INDEX_UPDATED_JOB_NAME, options);
}

export async function enqueueBsdToDelete(
  bsdId: string,
  options?: JobOptions
): Promise<void> {
  await indexQueue.add(DELETE_JOB_NAME, bsdId, options);
}

export function closeIndexAndUpdatesQueue() {
  return Promise.all([indexQueue.close(), updatesQueue.close()]);
}
