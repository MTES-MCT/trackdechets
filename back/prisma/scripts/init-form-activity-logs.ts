import { Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { registerUpdater, Updater } from "./helper/helper";

const CHUNK_SIZE = 100;

@registerUpdater(
  "Init Form activity logs",
  "Create a `BsddCreated` event for every existing Form. It acts as a starting point in time.",
  false
)
export class LoadAnonymousCompaniesUpdater implements Updater {
  async run() {
    try {
      console.info("✨ Starting script to init Form activity logs...");

      const firstBsddCreatedEvent = await prisma.event.findFirst({
        orderBy: { createdAt: "asc" },
        where: { type: "BsddCreated" }
      });

      const start = firstBsddCreatedEvent
        ? new Date(firstBsddCreatedEvent.createdAt.getTime() - 500) // Event obj is created after the form. We take a 0.5s margin
        : new Date();

      const where = {
        createdAt: {
          lt: start
        }
      };
      const formsCount = await prisma.form.count({ where });
      console.info(
        `🔢 There are ${formsCount} forms to process. Chunk size is ${CHUNK_SIZE}`
      );

      let cursor: string | null = null;
      for (let i = 0; i < formsCount; i += CHUNK_SIZE) {
        const chunkForms = await prisma.form.findMany({
          where,
          orderBy: { id: "asc" },
          take: CHUNK_SIZE,
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
        });

        cursor = chunkForms[chunkForms.length - 1].id;

        await prisma.event.createMany({
          data: chunkForms.map(form => ({
            createdAt: new Date("2018-01-01T00:00:00"), // A date that for sure is before any existing Form
            streamId: form.id,
            type: "BsddCreated",
            actor: "script",
            data: {
              content: JSON.parse(JSON.stringify(form)) as Prisma.InputJsonValue
            },
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
