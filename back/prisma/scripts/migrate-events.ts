import { insertStreamEvents } from "../../src/events/mongodb";
import { prisma } from "@td/prisma";
import { registerUpdater, Updater } from "./helper/helper";

const BATCH_SIZE = 1000;

@registerUpdater("Migrate events", `Migrate Psql events to Mongo`, false)
export class SetContactsUpdater implements Updater {
  async run() {
    console.info("Starting script to migrate psql events...");

    try {
      let counter = 0;
      const totalNumberOfEvents = await prisma.event.count();
      console.info(`🧮 There are ${totalNumberOfEvents} events to migrate`);
      console.info(`ℹ️ Batch size is ${BATCH_SIZE}\n`);

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const events = await prisma.event.findMany({
          take: BATCH_SIZE
        });

        if (events.length === 0) return 0;

        await insertStreamEvents(events);

        await prisma.event.deleteMany({
          where: { id: { in: events.map(e => e.id) } }
        });

        counter++;
        printProgress(counter, totalNumberOfEvents);

        if (events.length < BATCH_SIZE) break;
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}

function printProgress(batchNb: number, totalNumberOfEvents: number) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  const progress = Math.round(
    ((batchNb * BATCH_SIZE) / totalNumberOfEvents) * 100
  );
  process.stdout.write(`Batch number: ${batchNb} - ${progress}% done.`);
}
