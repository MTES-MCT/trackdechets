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

export async function run() {
  logger.info("starting BSDA draft restriction script");
  const mongodbClient = new MongoClient(MONGO_URL!);

  const database = mongodbClient.db();
  const eventsCollection =
    database.collection<EventCollection>(EVENTS_COLLECTION);
  let finished = false;
  let lastId: string | null = null;
  while (!finished) {
    let bsdas: Prisma.BsdaGetPayload<{
      include: {
        intermediaries: true;
        transporters: true;
      };
    }>[] = [];
    try {
      bsdas = await prisma.bsda.findMany({
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
          isDraft: true
        },
        include: {
          intermediaries: true,
          transporters: true
        },
        orderBy: {
          id: "asc"
        }
      });
    } catch (error) {
      logger.error(`failed to fetch bsdas from cursor ${lastId}`);
      logger.error(error);
      break;
    }
    logger.info(`got BSDAs ${bsdas.map(bsda => bsda.id).join(", ")}`);
    if (bsdas.length < 10) {
      finished = true;
    }
    if (bsdas.length === 0) {
      break;
    }
    lastId = bsdas[bsdas.length - 1].id;
    let events: EventCollection[];
    try {
      events = await eventsCollection
        .find({
          streamId: { $in: bsdas.map(bsda => bsda.id) },
          type: "BsdaCreated"
        })
        .toArray();
      logger.info(
        `got events ${events.map(event => event.streamId).join(", ")}`
      );
    } catch (error) {
      logger.error(
        `failed to fetch events for BSDAS ${bsdas
          .map(bsda => bsda.id)
          .join(", ")}`
      );
      logger.error(error);
      break;
    }

    for (const bsda of bsdas) {
      logger.info(`handling ${bsda.id}`);
      const correspondingEvent = events.find(
        event => event.streamId === bsda.id
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
      const intermediariesOrgIds: string[] = bsda.intermediaries
        ? (bsda.intermediaries
            .flatMap(intermediary => [
              intermediary.siret,
              intermediary.vatNumber
            ])
            .filter(Boolean) as string[])
        : [];
      const transportersOrgIds: string[] = bsda.transporters
        ? (bsda.transporters
            .flatMap(t => [
              t.transporterCompanySiret,
              t.transporterCompanyVatNumber
            ])
            .filter(Boolean) as string[])
        : [];
      let canAccessDraftOrgIds: string[] = [];
      const bsdaOrgIds = [
        ...intermediariesOrgIds,
        ...transportersOrgIds,
        bsda.emitterCompanySiret,
        bsda.ecoOrganismeSiret,
        bsda.destinationCompanySiret,
        bsda.destinationOperationNextDestinationCompanySiret,
        bsda.workerCompanySiret,
        bsda.brokerCompanySiret
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
          bsdaOrgIds.includes(orgId)
        );
        canAccessDraftOrgIds.push(...userOrgIdsInForm);
      } else {
        logger.info("treating without user");
        canAccessDraftOrgIds = bsdaOrgIds.filter(Boolean) as string[];
      }
      logger.info(`updating ${bsda.id}`);
      await prisma.bsda.update({
        where: { id: bsda.id },
        data: {
          canAccessDraftOrgIds
        },
        select: {
          id: true
        }
      });
      enqueueUpdatedBsdToIndex(bsda.id);
      logger.info(`updated ${bsda.id}`);
    }
  }
  logger.info("exiting");
  await mongodbClient.close();
  logger.info("mongo connection closed");
}
