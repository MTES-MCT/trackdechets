import { deleteStreamEvent, getStreamEvents } from "../../events/mongodb";
import { prisma } from "@td/prisma";
import { cursorTo, clearLine } from "node:readline";

const PAGE_SIZE = 1_000; // Keep it relatively small as iterating over all events can be slow

export async function cleanMongoEvents() {
  console.info(`Buckle up, you're in for a while...`);

  await iterateOverModelAndCleanEvents("BSDASRI", cursor =>
    prisma.bsdasri.findMany({
      take: PAGE_SIZE,
      orderBy: { rowNumber: "asc" },
      ...(cursor ? { skip: 1, cursor: { rowNumber: cursor } } : {})
    })
  );

  await iterateOverModelAndCleanEvents("BSDD", cursor =>
    prisma.form.findMany({
      take: PAGE_SIZE,
      orderBy: { rowNumber: "asc" },
      ...(cursor ? { skip: 1, cursor: { rowNumber: cursor } } : {})
    })
  );

  await iterateOverModelAndCleanEvents("BSDA", cursor =>
    prisma.bsda.findMany({
      take: PAGE_SIZE,
      orderBy: { rowNumber: "asc" },
      ...(cursor ? { skip: 1, cursor: { rowNumber: cursor } } : {})
    })
  );

  await iterateOverModelAndCleanEvents("BSFF", cursor =>
    prisma.bsff.findMany({
      take: PAGE_SIZE,
      orderBy: { rowNumber: "asc" },
      ...(cursor ? { skip: 1, cursor: { rowNumber: cursor } } : {})
    })
  );

  await iterateOverModelAndCleanEvents("BSVHU", cursor =>
    prisma.bsvhu.findMany({
      take: PAGE_SIZE,
      orderBy: { rowNumber: "asc" },
      ...(cursor ? { skip: 1, cursor: { rowNumber: cursor } } : {})
    })
  );
}

async function iterateOverModelAndCleanEvents(
  modelName: string,
  getter: (
    cursor: number | null
  ) => Promise<{ id: string; rowNumber: number }[]>
) {
  console.info(`Starting to clean events for ${modelName}...`);

  let bsdProcessedCounter = 0;
  let bsdDeletedEventsCounter = 0;
  let cursor: number | null = null;

  /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
  while (true) {
    const bsds = await getter(cursor);
    cursor = bsds[bsds.length - 1]?.rowNumber;

    for (const bsd of bsds) {
      bsdDeletedEventsCounter += await cleanStreamEvents(bsd.id);
      printProgress(
        `Processed ${modelName}: \x1b[32m${++bsdProcessedCounter}\x1b[0m - Deleted events: \x1b[31m${bsdDeletedEventsCounter}\x1b[0m`
      );
    }

    if (bsds.length < PAGE_SIZE || !cursor) {
      break;
    }
  }

  console.info(
    `Done with ${modelName}: Processed bsd=${bsdProcessedCounter} - Deleted events=${bsdDeletedEventsCounter}`
  );
}

async function cleanStreamEvents(streamId: string): Promise<number> {
  let nbOfDeletedEvents = 0;
  const eventsStream = await getStreamEvents(streamId);

  let previousEvent;
  for await (const event of eventsStream) {
    if (
      previousEvent &&
      JSON.stringify(previousEvent.data) === JSON.stringify(event.data)
    ) {
      await deleteStreamEvent({ streamId, eventId: event._id });
      nbOfDeletedEvents++;
    } else {
      previousEvent = event;
    }
  }
  return nbOfDeletedEvents;
}

function printProgress(text: string) {
  clearLine(process.stdout, 0);
  cursorTo(process.stdout, 0);
  process.stdout.write(text);
}
