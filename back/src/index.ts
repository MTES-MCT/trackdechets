import "@total-typescript/ts-reset";
import "@td/tracer";
import { envVariables } from "@td/env";
import { z } from "zod";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}

export { httpServer, server, startApolloServer } from "./server";
export { closeQueues } from "./queue/producers";
export { initSentry } from "./common/sentry";
export * from "./utils";
export { deleteBsd } from "./common/elastic";
export { getCompaniesAndActiveAdminsByCompanyOrgIds } from "./companies/database";
export { formatDate } from "./common/pdf";
export { sendMail } from "./mailer/mailing";
export { BsdUpdateQueueItem, updatesQueue } from "./queue/producers/bsdUpdate";
export { operationHooksQueue } from "./queue/producers/operationHook";
export { administrativeTransferQueue } from "./queue/producers/administrativeTransfer";
export { updateAppendix2Queue } from "./queue/producers/updateAppendix2";
export {
  indexBsdJob,
  operationHookJob,
  updateAppendix2Job,
  sendMailJob,
  postGericoJob,
  processAdministrativeTransferJob
} from "./queue/jobs";

export {
  indexQueue,
  bulkIndexQueue,
  bulkIndexMasterQueue
} from "./queue/producers/elastic";
export { sirenifyQueue } from "./queue/producers/sirenify";
export { mailQueue } from "./queue/producers/mail";
export { syncEventsQueue } from "./queue/producers/events";

export {
  geocodeCompanyQueue,
  setCompanyDepartementQueue
} from "./queue/producers/company";
export { addToMailQueue } from "./queue/producers/mail";
export { geocodeJob } from "./queue/jobs/geocode";
export { setDepartementJob } from "./queue/jobs/setDepartement";
export { syncEventsJob } from "./queue/jobs/syncEvents";
export { favoritesCompanyQueue } from "./queue/producers/company";
export {
  DELETE_JOB_NAME,
  INDEX_JOB_NAME,
  INDEX_CREATED_JOB_NAME,
  INDEX_UPDATED_JOB_NAME,
  SIRENIFY_JOB_NAME,
  SEND_GERICO_API_REQUEST_JOB_NAME
} from "./queue/producers/jobNames";
export { deleteBsdJob } from "./queue/jobs/deleteBsd";
export { indexFavoritesJob } from "./queue/jobs/indexFavorites";
export { indexChunkBsdJob, indexAllInBulkJob } from "./queue/jobs/indexAllBsds";
export { sendHookJob } from "./queue/jobs/sendHook";

export {
  webhooksQueue,
  SEND_WEBHOOK_JOB_NAME
} from "./queue/producers/webhooks";
export { sirenifyBsdJob } from "./queue/jobs/sirenifyBsd";
export { associateUserToCompany } from "./users/database";
export { Mutation, MutationDeleteCompanyArgs } from "./generated/graphql/types";
export { redisClient } from "./common/redis";
export { client as esClient, index as esIndex } from "./common/elastic";
export { closeMongoClient } from "./events/mongodb";
export { hashPassword } from "./users/utils";
export { generateUniqueTestSiret } from "./companies/resolvers/mutations/createTestCompany";
export { createUser } from "./users/database";
export { default as getReadableId, ReadableIdPrefix } from "./forms/readableId";
export { reindex } from "./bsds/indexation/reindexBsdHelpers";
export { gericoQueue } from "./queue/producers/gerico";
export { getBsdasriFromActivityEvents } from "./activity-events/bsdasri";
export { getBsdaFromActivityEvents } from "./activity-events/bsda";
export { getBsddFromActivityEvents } from "./activity-events/bsdd";
