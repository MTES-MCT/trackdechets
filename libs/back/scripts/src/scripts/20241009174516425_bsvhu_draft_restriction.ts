import { MongoClient } from "mongodb";
import Queue, { JobOptions } from "bull";
import { Company, Event, Prisma, User } from "@td/prisma";
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
  logger.info("starting BSVHU draft restriction script");
  const mongodbClient = new MongoClient(MONGO_URL!);

  const database = mongodbClient.db();
  const eventsCollection =
    database.collection<EventCollection>(EVENTS_COLLECTION);
  let finished = false;
  let lastId: string | null = null;
  while (!finished) {
    let bsvhus: Prisma.BsvhuGetPayload<{
      include: {
        intermediaries: true;
      };
    }>[] = [];
    try {
      bsvhus = await prisma.bsvhu.findMany({
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
        include: {
          intermediaries: true
        },
        orderBy: {
          id: "asc"
        }
      });
    } catch (error) {
      logger.error(`failed to fetch bsvhus from cursor ${lastId}`);
      logger.error(error);
      break;
    }
    logger.info(`got BSVHUs ${bsvhus.map(bsvhu => bsvhu.id).join(", ")}`);
    if (bsvhus.length < 10) {
      finished = true;
    }
    if (bsvhus.length === 0) {
      break;
    }
    lastId = bsvhus[bsvhus.length - 1].id;
    let events: EventCollection[];
    try {
      events = await eventsCollection
        .find({
          streamId: { $in: bsvhus.map(bsda => bsda.id) },
          type: "BsvhuCreated"
        })
        .toArray();
      logger.info(
        `got events ${events.map(event => event.streamId).join(", ")}`
      );
    } catch (error) {
      logger.error(
        `failed to fetch events for bsvhus ${bsvhus
          .map(bsvhu => bsvhu.id)
          .join(", ")}`
      );
      logger.error(error);
      break;
    }

    for (const bsvhu of bsvhus) {
      logger.info(`handling ${bsvhu.id}`);
      const correspondingEvent = events.find(
        event => event.streamId === bsvhu.id
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
      const intermediariesOrgIds: string[] = bsvhu.intermediaries
        ? (bsvhu.intermediaries
            .flatMap(intermediary => [
              intermediary.siret,
              intermediary.vatNumber
            ])
            .filter(Boolean) as string[])
        : [];
      let canAccessDraftOrgIds: string[] = [];
      const bsvhuOrgIds = [
        ...intermediariesOrgIds,
        bsvhu.emitterCompanySiret,
        bsvhu.ecoOrganismeSiret,
        ...[
          bsvhu.transporterCompanySiret,
          bsvhu.transporterCompanyVatNumber
        ].filter(Boolean),
        bsvhu.destinationCompanySiret,
        bsvhu.destinationOperationNextDestinationCompanySiret,
        bsvhu.brokerCompanySiret,
        bsvhu.traderCompanySiret
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
          bsvhuOrgIds.includes(orgId)
        );
        canAccessDraftOrgIds.push(...userOrgIdsInForm);
      } else {
        logger.info("treating without user");
        canAccessDraftOrgIds = bsvhuOrgIds.filter(Boolean) as string[];
      }
      logger.info(`updating ${bsvhu.id}`);
      await prisma.bsvhu.update({
        where: { id: bsvhu.id },
        data: {
          canAccessDraftOrgIds
        },
        select: {
          id: true
        }
      });
      enqueueUpdatedBsdToIndex(bsvhu.id);
      logger.info(`updated ${bsvhu.id}`);
    }
  }
  logger.info("exiting");
  await mongodbClient.close();
  logger.info("mongo connection closed");
}
