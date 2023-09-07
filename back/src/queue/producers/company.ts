// eslint-disable-next-line import/no-named-as-default
import Queue, { JobOptions } from "bull";

const { REDIS_URL, QUEUE_NAME_COMPANY } = process.env;

const queueNameCompany = QUEUE_NAME_COMPANY || "queue_company";

export type GeocodeJobData = { siret: string; address?: string };

export type SetDepartementJobData = { siret: string; codeCommune?: string };

// default options can be overwritten by the calling function
const defaultJobOptions: JobOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 100 },
  timeout: 10000
};

/**
 * This queue is used to off load retrieving latitude and longitude info for a company
 */
export const geocodeCompanyQueue = new Queue(
  `${queueNameCompany}_geocode`,
  `${REDIS_URL}`,

  {
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
export const setCompanyDepartementQueue = new Queue(
  `${queueNameCompany}_set_departement`,
  `${REDIS_URL}`,
  {
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
  await geocodeCompanyQueue.add(data, {
    ...defaultJobOptions,
    ...options
  });
}

export async function addToSetCompanyDepartementQueue(
  data: SetDepartementJobData,
  options?: JobOptions
) {
  await setCompanyDepartementQueue.add(data, {
    ...defaultJobOptions,
    ...options
  });
}

/**
 * This queue is used to process favorites cache
 */
export const favoritesCompanyQueue = new Queue(
  `${queueNameCompany}_favorites`,
  `${REDIS_URL}`,

  {
    defaultJobOptions: {
      removeOnComplete: 10_000
    }
  }
);

/**
 * Close gracefully the queues
 */
export const closeCompanyQueues = () => {
  geocodeCompanyQueue.close();
  setCompanyDepartementQueue.close();
  favoritesCompanyQueue.close();
};
