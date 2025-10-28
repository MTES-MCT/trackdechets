import { prisma } from "@td/prisma";
import { logger } from "@td/logger";
import Queue, { JobOptions } from "bull";
import { Bsvhu } from "@td/prisma";

const { REDIS_URL, NODE_ENV } = process.env;

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
  await indexQueue.add("index_updated", bsdId, options);
}

export async function run() {
  logger.info("starting Bsvhu transporter copy script");
  let finished = false;
  let lastId: string | null = null;
  let total = 0;
  while (!finished) {
    let bsvhus: Bsvhu[] = [];
    try {
      bsvhus = await prisma.bsvhu.findMany({
        where: {
          OR: [
            { transporterCompanySiret: { not: null } },
            { transporterCompanyVatNumber: { not: null } }
          ]
        },
        take: 100,
        skip: 1, // Skip the cursor
        ...(lastId ? { cursor: { id: lastId } } : {})
      });
    } catch (error) {
      logger.error(`failed to fetch bsvhus from cursor ${lastId}`);
      logger.error(error);
      break;
    }
    total += bsvhus.length;
    logger.info(`got ${bsvhus.length} bsvhus, total ${total}`);
    if (bsvhus.length < 100) {
      finished = true;
    }
    if (bsvhus.length === 0) {
      break;
    }
    lastId = bsvhus[bsvhus.length - 1].id;

    for (const bsvhu of bsvhus) {
      try {
        await prisma.bsvhuTransporter.create({
          data: {
            bsvhuId: bsvhu.id,
            number: 1,
            transporterCompanySiret: bsvhu.transporterCompanySiret,
            transporterCompanyName: bsvhu.transporterCompanyName,
            transporterCompanyVatNumber: bsvhu.transporterCompanyVatNumber,
            transporterCompanyAddress: bsvhu.transporterCompanyAddress,
            transporterCompanyContact: bsvhu.transporterCompanyContact,
            transporterCompanyPhone: bsvhu.transporterCompanyPhone,
            transporterCompanyMail: bsvhu.transporterCompanyMail,
            transporterCustomInfo: bsvhu.transporterCustomInfo,
            transporterRecepisseIsExempted:
              bsvhu.transporterRecepisseIsExempted,
            transporterRecepisseNumber: bsvhu.transporterRecepisseNumber,
            transporterRecepisseDepartment:
              bsvhu.transporterRecepisseDepartment,
            transporterRecepisseValidityLimit:
              bsvhu.transporterRecepisseValidityLimit,
            transporterTransportMode: bsvhu.transporterTransportMode,
            transporterTransportPlates: bsvhu.transporterTransportPlates,
            transporterTransportTakenOverAt:
              bsvhu.transporterTransportTakenOverAt,
            transporterTransportSignatureAuthor:
              bsvhu.transporterTransportSignatureAuthor,
            transporterTransportSignatureDate:
              bsvhu.transporterTransportSignatureDate
          }
        });
        const orgId =
          bsvhu.transporterCompanySiret || bsvhu.transporterCompanyVatNumber;
        if (orgId) {
          await prisma.bsvhu.update({
            where: { id: bsvhu.id },
            data: {
              transportersOrgIds: [orgId]
            },
            select: {
              id: true
            }
          });
          enqueueUpdatedBsdToIndex(bsvhu.id);
        }
      } catch (error) {
        logger.error(`failed to handle ${bsvhu.id}`);
        logger.error(error);
        break;
      }
    }
  }
  logger.info("exiting");
}
