import axios from "axios";
import { Job } from "bull";
import { BsdIndexationConfig } from "../../common/elastic";
import { findManyAndIndexBsds } from "../../bsds/indexation/bulkIndexBsds";
import { FindManyAndIndexBsdsFnSignature } from "../../bsds/indexation/types";
import { reindexAllBsdsInBulk } from "../../bsds/indexation";
import { logger } from "@td/logger";

const {
  SCALINGO_API_URL,
  SCALINGO_APP_NAME,
  SCALINGO_TOKEN,
  BULK_INDEX_SCALINGO_ACTIVE_AUTOSCALING,
  BULK_INDEX_SCALINGO_CONTAINER_NAME,
  BULK_INDEX_SCALINGO_CONTAINER_SIZE_UP,
  BULK_INDEX_SCALINGO_CONTAINER_SIZE_DOWN,
  BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_UP,
  BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_DOWN
} = process.env;

/**
 * Récupère un Bearer Token valable 1 heure
 * @param scalingoToken Token d'api
 * @returns Bearer Token valable 1h
 */
async function getBearerToken(scalingoToken) {
  const response = await axios.post<{ token: string }>(
    "https://auth.scalingo.com/v1/tokens/exchange",
    null,
    {
      auth: {
        username: "",
        password: scalingoToken
      }
    }
  );
  return response.data;
}

/**
 * Index one chunk of one given type of BSD
 */
export async function indexChunkBsdJob(job: Job<string>) {
  try {
    const { bsdName, index, ids, elasticSearchUrl } = JSON.parse(
      job.data
    ) as FindManyAndIndexBsdsFnSignature;
    logger.info(
      `Started job indexChunk for the following bsd and index names : "${bsdName}", "${index}"`
    );
    // will index a chunk of BSD to the given elasticSearchUrl
    await findManyAndIndexBsds({
      bsdName,
      index,
      ids,
      elasticSearchUrl
    });
    return null;
  } catch (error) {
    logger.error(`Error in indexChunkBsdJob.`, error);
    throw error;
  }
}

/**
 * Attend la fin des opération de scaling up pour demander le scale down
 */
const sleepUntil = async (
  operationsUrl: string,
  timeoutMs: number
): Promise<void> => {
  const scalingoOperationStatus = async operationsUrl => {
    if (!operationsUrl) return true;
    const { token: bearerToken } = await getBearerToken(SCALINGO_TOKEN);
    const { data } = await axios.get<{
      operation: {
        status: string;
      };
    }>(operationsUrl, {
      headers: {
        Authorization: `Bearer ${bearerToken}`
      }
    });
    if (["done", "error"].includes(data?.operation?.status)) {
      return true;
    }
    return false;
  };

  return new Promise((resolve, reject) => {
    const timeWas = new Date();
    const wait = setInterval(async function () {
      const now = new Date();
      const result = await scalingoOperationStatus(operationsUrl);
      if (result === true) {
        clearInterval(wait);
        resolve();
      } else if (now.getTime() - timeWas.getTime() > timeoutMs) {
        // Timeout
        clearInterval(wait);
        reject();
      }
    }, 2000); // check scalingoOperationStatus every 2 secs
  });
};

/**
 * Index all of BSD in other jobs
 * Si l'environnement du worker passe BULK_INDEX_SCALINGO_ACTIVE_AUTOSCALING=true
 * alors il est requis d'avoir aussi les autres variables présentes
 *  SCALINGO_API_URL,
 *  SCALINGO_APP_NAME,
 *  SCALINGO_TOKEN,
 *  BULK_INDEX_SCALINGO_ACTIVE_AUTOSCALING,
 *  BULK_INDEX_SCALINGO_CONTAINER_NAME,
 *  BULK_INDEX_SCALINGO_CONTAINER_SIZE_UP,
 *  BULK_INDEX_SCALINGO_CONTAINER_SIZE_DOWN,
 *  BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_UP,
 *  BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_DOWN
 */
export async function indexAllInBulkJob(job: Job<string>) {
  try {
    const { index, force } = JSON.parse(job.data) as {
      index: BsdIndexationConfig;
      force: boolean;
    };
    let operationsUrl;
    if (BULK_INDEX_SCALINGO_ACTIVE_AUTOSCALING === "true") {
      const { token: bearerToken } = await getBearerToken(SCALINGO_TOKEN);
      // scale-up indexqueue workers
      axios({
        method: "post",
        url: `https://${SCALINGO_API_URL}/v1/apps/${SCALINGO_APP_NAME}/scale`,
        data: {
          containers: [
            {
              name: BULK_INDEX_SCALINGO_CONTAINER_NAME,
              amount:
                parseInt(BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_UP!, 10) || 4,
              size: BULK_INDEX_SCALINGO_CONTAINER_SIZE_UP || "2XL"
            }
          ]
        },
        headers: {
          Authorization: `Bearer ${bearerToken}`
        }
      })
        .then(resp => {
          if (resp) {
            operationsUrl = resp.headers.location;
          }
          logger.info(
            `Scaled-up ${SCALINGO_APP_NAME} ${BULK_INDEX_SCALINGO_CONTAINER_NAME} workers to ${BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_UP} ${BULK_INDEX_SCALINGO_CONTAINER_SIZE_UP}, operation url is ${operationsUrl}`,
            resp.data
          );
        })
        .catch(error => {
          logger.error(
            `Failed to scale-up ${SCALINGO_APP_NAME} ${BULK_INDEX_SCALINGO_CONTAINER_NAME} workers to ${BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_UP} ${BULK_INDEX_SCALINGO_CONTAINER_SIZE_UP}, please take a manual action instead\n`,
            error
          );
        });
    }

    // Start jobs to index all BSD without downtime in chunks
    // Each Chunk is a separate job in the queue.
    // only if need because of a mapping change or if "force" is true
    await reindexAllBsdsInBulk({
      index,
      force,
      useQueue: true
    });
    if (BULK_INDEX_SCALINGO_ACTIVE_AUTOSCALING === "true") {
      // scale-down indexqueue workers
      try {
        // Wait or timeout after 60sec to scale down.
        // Scalingo does-not support scaling operations while other operation are not finished
        // After scaling-up, the status of the application will be changed to ‘scaling’ for the scaling duration.
        // No other operation is doable until the app status has switched to “running” again.
        await sleepUntil(operationsUrl, 60000);
        // ready
        await scaleDownScalingo();
      } catch {
        // timeout
        await scaleDownScalingo();
      }
    }
    return null;
  } catch (jobError) {
    logger.error(`Error in indexAllInBulk job.`, { job, jobError });
    throw jobError;
  }
}

async function scaleDownScalingo() {
  const { token: bearerToken } = await getBearerToken(SCALINGO_TOKEN);
  axios({
    method: "post",
    url: `https://${SCALINGO_API_URL}/v1/apps/${SCALINGO_APP_NAME}/scale`,
    data: {
      containers: [
        {
          name: BULK_INDEX_SCALINGO_CONTAINER_NAME,
          amount: parseInt(BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_DOWN!, 10) || 1,
          size: BULK_INDEX_SCALINGO_CONTAINER_SIZE_DOWN || "M"
        }
      ]
    },
    headers: {
      Authorization: `Bearer ${bearerToken}`
    }
  })
    .then(resp => {
      logger.info(
        `Scaled-down ${SCALINGO_APP_NAME} ${BULK_INDEX_SCALINGO_CONTAINER_NAME} workers to ${BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_DOWN} ${BULK_INDEX_SCALINGO_CONTAINER_SIZE_DOWN}`,
        resp.data
      );
    })
    .catch(function (error) {
      logger.error(
        `Failed to scale-down ${BULK_INDEX_SCALINGO_CONTAINER_NAME} workers to ${BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_DOWN} ${BULK_INDEX_SCALINGO_CONTAINER_SIZE_DOWN}, please take a manual action instead\n`,
        error
      );
    });
}
