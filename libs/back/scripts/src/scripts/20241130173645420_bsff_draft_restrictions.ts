import { MongoClient } from "mongodb";
import Queue, { JobOptions } from "bull";
import { Company, Event, Prisma, User } from "@prisma/client";
import { prisma } from "@td/prisma";
import { logger } from "@td/logger";

type EventLike = Omit<Event, "metadata" | "data"> & {
  data: any;
  metadata: any;
};

type EventCollection = { _id: string } & Omit<EventLike, "id">;

const { MONGO_URL, REDIS_URL, NODE_ENV } = process.env;
const EVENTS_COLLECTION = "events";
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
  logger.info(`Enqueuing BSD ${bsdId} for indexation`);
  await indexQueue.add("index_updated", bsdId, options);
}

async function getUserCompanies(userId: string): Promise<Company[]> {
  const companyAssociations = await prisma.companyAssociation.findMany({
    where: { userId },
    include: { company: true }
  });
  return companyAssociations.map(association => association.company);
}

const BATCH_SIZE = 10;
export async function run() {
  logger.info("starting BSSF draft restriction script");
  const mongodbClient = new MongoClient(MONGO_URL!);

  const database = mongodbClient.db();
  const eventsCollection =
    database.collection<EventCollection>(EVENTS_COLLECTION);
  let finished = false;
  let lastId: string | null = null;

  while (!finished) {
    let bsffs: Prisma.BsffGetPayload<{
      include: {
        transporters: true;
      };
    }>[] = [];
    try {
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
        where: {
          AND: [
            {
              isDraft: true
            },
            {
              NOT: {
                isDeleted: true
              }
            }
          ]
        },
        include: {
          transporters: true
        },
        orderBy: {
          id: "asc"
        }
      });
    } catch (error) {
      logger.error(`failed to fetch bsffs from cursor ${lastId}`);
      logger.error(error);
      break;
    }
    logger.info(`got BSFFs ${bsffs.map(bsff => bsff.id).join(", ")}`);
    if (bsffs.length < BATCH_SIZE) {
      finished = true;
    }
    if (bsffs.length === 0) {
      break;
    }
    lastId = bsffs[bsffs.length - 1].id;
    let events: EventCollection[];
    try {
      events = await eventsCollection
        .find({
          streamId: { $in: bsffs.map(bsff => bsff.id) },
          type: "BsffCreated"
        })
        .toArray();
      logger.info(
        `got events ${events.map(event => event.streamId).join(", ")}`
      );
    } catch (error) {
      logger.error(
        `failed to fetch events for bsffs ${bsffs
          .map(bsff => bsff.id)
          .join(", ")}`
      );
      logger.error(error);
      break;
    }

    for (const bsff of bsffs) {
      logger.info(`handling ${bsff.id}`);
      const correspondingEvent = events.find(
        event => event.streamId === bsff.id
      );
      let user: User | null = null;
      if (correspondingEvent?.actor) {
        logger.info("found creation event");
        try {
          user = await prisma.user.findFirst({
            where: {
              id: correspondingEvent.actor
            }
          });
        } catch (_) {
          logger.error(`failed to fetch user ${correspondingEvent.actor}`);
        }
      }
      let canAccessDraftOrgIds: string[] = [];
      const trsOrgIds = bsff.transporters.reduce(
        (acc, trs) => [
          ...acc,
          trs.transporterCompanySiret,
          trs.transporterCompanyVatNumber
        ],
        []
      );
      const bsffOrgIds = [
        bsff.emitterCompanySiret,
        bsff.destinationCompanySiret,
        ...trsOrgIds
      ].filter(Boolean);

      if (user) {
        logger.info("treating with user");
        let userCompanies: Company[] = [];
        try {
          userCompanies = await getUserCompanies(user.id as string);
        } catch (_) {
          logger.error(`failed to fetch companies of user ${user.id}`);
        }
        const userOrgIds = userCompanies.map(company => company.orgId);
        const userOrgIdsInForm = userOrgIds.filter(orgId =>
          bsffOrgIds.includes(orgId)
        );
        canAccessDraftOrgIds.push(...userOrgIdsInForm);
      } else {
        logger.info("treating without user");
        canAccessDraftOrgIds = bsffOrgIds.filter(Boolean) as string[];
      }
      logger.info(`updating ${bsff.id}`);
      await prisma.bsff.update({
        where: { id: bsff.id },
        data: {
          canAccessDraftOrgIds
        },
        select: {
          id: true
        }
      });
      enqueueUpdatedBsdToIndex(bsff.id);
      logger.info(`updated ${bsff.id}`);
    }
  }
}
