import "@total-typescript/ts-reset";
import { envVariables } from "@td/env";
import { z } from "zod";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}
import prisma from "./prisma";

export { httpServer, server, startApolloServer } from "./server";
export { closeQueues } from "./queue/producers";
export { initSentry } from "./common/sentry";
export * from "./utils";
export { prisma };
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
export { associateUserToCompany } from "./users/database";
export { Mutation, MutationDeleteCompanyArgs } from "./generated/graphql/types";
export { redisClient } from "./common/redis";
export { client as esClient, index as esIndex } from "./common/elastic";
export { closeMongoClient } from "./events/mongodb";
