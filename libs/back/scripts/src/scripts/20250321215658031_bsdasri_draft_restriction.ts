import { MongoClient } from "mongodb";
import Queue, { JobOptions } from "bull";
import { Bsdasri, Company, Event, User } from "@prisma/client";
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

export async function run() {
  logger.info("starting BSDASRI draft restriction script");
  const mongodbClient = new MongoClient(MONGO_URL!);

  const database = mongodbClient.db();
  const eventsCollection =
    database.collection<EventCollection>(EVENTS_COLLECTION);
  let finished = false;
  let lastId: string | null = null;
  while (!finished) {
    let bsdasris: Bsdasri[] = [];
    try {
      bsdasris = await prisma.bsdasri.findMany({
        take: 10,
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

        orderBy: {
          id: "asc"
        }
      });
    } catch (error) {
      logger.error(`failed to fetch bsdasris from cursor ${lastId}`);
      logger.error(error);
      break;
    }
    logger.info(
      `got BSDASRIS ${bsdasris.map(bsdasri => bsdasri.id).join(", ")}`
    );
    if (bsdasris.length < 10) {
      finished = true;
    }
    if (bsdasris.length === 0) {
      break;
    }
    lastId = bsdasris[bsdasris.length - 1].id;
    let events: EventCollection[];
    try {
      events = await eventsCollection
        .find({
          streamId: { $in: bsdasris.map(bsdasri => bsdasri.id) },
          type: "BsdasriCreated"
        })
        .toArray();
      logger.info(
        `got events ${events.map(event => event.streamId).join(", ")}`
      );
    } catch (error) {
      logger.error(
        `failed to fetch events for bsdasris ${bsdasris
          .map(bsdasri => bsdasri.id)
          .join(", ")}`
      );
      logger.error(error);
      break;
    }

    for (const bsdasri of bsdasris) {
      logger.info(`handling ${bsdasri.id}`);
      const correspondingEvent = events.find(
        event => event.streamId === bsdasri.id
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
      const bsdasriOrgIds = [
        bsdasri.emitterCompanySiret,
        bsdasri.ecoOrganismeSiret,
        ...[
          bsdasri.transporterCompanySiret,
          bsdasri.transporterCompanyVatNumber
        ].filter(Boolean),
        bsdasri.destinationCompanySiret
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
          bsdasriOrgIds.includes(orgId)
        );
        canAccessDraftOrgIds.push(...userOrgIdsInForm);
      } else {
        logger.info("treating without user");
        canAccessDraftOrgIds = bsdasriOrgIds.filter(Boolean) as string[];
      }
      logger.info(`updating ${bsdasri.id}`);
      await prisma.bsdasri.update({
        where: { id: bsdasri.id },
        data: {
          canAccessDraftOrgIds
        },
        select: {
          id: true
        }
      });
      enqueueUpdatedBsdToIndex(bsdasri.id);
      logger.info(`updated ${bsdasri.id}`);
    }
  }
  logger.info("exiting");
  await mongodbClient.close();
  logger.info("mongo connection closed");
}
