// eslint-disable-next-line import/no-named-as-default
import Queue, { JobOptions } from "bull";

const { REDIS_URL, QUEUE_NAME_COMPANY } = process.env;

const queueNameCompany = QUEUE_NAME_COMPANY || "queue_company";

export type GeocodeJobData = { siret: string; address?: string };
export type SetDepartementJobData = { siret: string; codeCommune?: string };

const geocodeCompanyQueueName = `${queueNameCompany}_geocode`;
/**
 * This queue is used to off load retrieving latitude and longitude info for a company
 */
export const geocodeCompanyQueue = new Queue(
  geocodeCompanyQueueName,
  `${REDIS_URL}`,

  {
    prefix: `{${geocodeCompanyQueueName}}`,
    // prevent hitting api-adresse.data.gouv.fr limit
    limiter: {
      max: 15,
      duration: 1000 // ms
    },
    defaultJobOptions: {
      removeOnComplete: 10_000
    }
  }
);

/**
 * This queue is used to off load retrieving departement info for a company
 */

const setCompanyDepartementQueueName = `${queueNameCompany}_set_departement`;
export const setCompanyDepartementQueue = new Queue(
  setCompanyDepartementQueueName,
  `${REDIS_URL}`,
  {
    prefix: `{${setCompanyDepartementQueueName}}`,
    // prevent hitting geo.api.gouv.fr limit
    limiter: {
      max: 2,
      duration: 1000 // ms
    },
    defaultJobOptions: {
      removeOnComplete: 10_000
    }
  }
);

export async function addToGeocodeCompanyQueue(
  data: GeocodeJobData,
  options?: JobOptions
) {
  // default options can be overwritten by the calling function
  const jobOptions: JobOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 100 },
    timeout: 10000,
    ...options
  };
  await geocodeCompanyQueue.add(data, jobOptions);
}

export async function addToSetCompanyDepartementQueue(
  data: SetDepartementJobData,
  options?: JobOptions
) {
  // default options can be overwritten by the calling function
  const jobOptions: JobOptions = {
    attempts: 3,
    backoff: { type: "exponential", delay: 100 },
    timeout: 10000,
    ...options
  };
  await setCompanyDepartementQueue.add(data, jobOptions);
}

/**
 * Close gracefully the queues
 */
export const closeCompanyQueues = () => {
  geocodeCompanyQueue.close();
  setCompanyDepartementQueue.close();
};
