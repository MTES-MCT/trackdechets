import "@total-typescript/ts-reset";
import * as _ from "@td/tracer";
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
export { sendMailJob } from "./queue/jobs";
export { indexQueue } from "./queue/producers/elastic";
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
export { indexBsdJob } from "./queue/jobs";
export { favoritesCompanyQueue } from "./queue/producers/company";
export {
  DELETE_JOB_NAME,
  INDEX_JOB_NAME,
  INDEX_CREATED_JOB_NAME,
  INDEX_UPDATED_JOB_NAME
} from "./queue/producers/jobNames";
export { deleteBsdJob } from "./queue/jobs/deleteBsd";
export { indexFavoritesJob } from "./queue/jobs/indexFavorites";
export { indexChunkBsdJob, indexAllInBulkJob } from "./queue/jobs/indexAllBsds";
export { sendHookJob } from "./queue/jobs/sendHook";
export {
  webhooksQueue,
  SEND_WEBHOOK_JOB_NAME
} from "./queue/producers/webhooks";
export { associateUserToCompany } from "./users/database";
export { Mutation, MutationDeleteCompanyArgs } from "./generated/graphql/types";
export { redisClient } from "./common/redis";
export { client as esClient, index as esIndex } from "./common/elastic";
export { closeMongoClient } from "./events/mongodb";
