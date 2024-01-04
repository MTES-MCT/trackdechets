import { Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { registerUpdater, Updater } from "./helper/helper";

const CHUNK_SIZE = 100;

@registerUpdater(
  "Init Bsda activity logs",
  "Create a `BsdaCreated` event for every existing Bsda. It acts as a starting point in time.",
  false
)
export class InitBsdaActivityLogs implements Updater {
  async run() {
    try {
      console.info("✨ Starting script to init Bsda activity logs...");

      const firstBsdaCreatedEvent = await prisma.event.findFirst({
        orderBy: { createdAt: "asc" },
        where: { type: "BsdaCreated" }
      });

      const start = firstBsdaCreatedEvent
        ? new Date(firstBsdaCreatedEvent.createdAt.getTime() - 500) // Event obj is created after the bsda. We take a 0.5s margin
        : new Date();

      const where = {
        createdAt: {
          lt: start
        }
      };
      const bsdasCount = await prisma.bsda.count({ where });
      console.info(
        `🔢 There are ${bsdasCount} bsdas to process. Chunk size is ${CHUNK_SIZE}`
      );

      let cursor: string | null = null;
      for (let i = 0; i < bsdasCount; i += CHUNK_SIZE) {
        const chunkBsdas = await prisma.bsda.findMany({
          where,
          orderBy: { id: "asc" },
          take: CHUNK_SIZE,
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
        });

        cursor = chunkBsdas[chunkBsdas.length - 1].id;

        await prisma.event.createMany({
          data: chunkBsdas.map(bsda => ({
            createdAt: new Date("2018-01-01T00:00:00"), // A date that for sure is before any existing Bsda
            streamId: bsda.id,
            type: "BsdaCreated",
            actor: "script",
            data: JSON.parse(JSON.stringify(bsda)) as Prisma.InputJsonValue,
            metadata: { fake: true, origin: "initial migration" }
          }))
        });
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
