import { deleteStreamEvent, getStreamEvents } from "../../events/mongodb";
import { prisma } from "@td/prisma";

const PAGE_SIZE = 1_000; // Keep it relatively small as iterating over all events can be slow

export async function cleanMongoEvents() {
  console.info(`Buckle up, you're in for a while...`);

  await iterateOverModelAndCleanEvents("BSDASRI", cursor =>
    prisma.bsdasri.findMany({
      take: PAGE_SIZE,
      orderBy: { rowNumber: "asc" },
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    })
  );

  await iterateOverModelAndCleanEvents("BSDD", cursor =>
    prisma.form.findMany({
      take: PAGE_SIZE,
      orderBy: { rowNumber: "asc" },
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    })
  );

  await iterateOverModelAndCleanEvents("BSDA", cursor =>
    prisma.bsda.findMany({
      take: PAGE_SIZE,
      orderBy: { rowNumber: "asc" },
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    })
  );

  await iterateOverModelAndCleanEvents("BSFF", cursor =>
    prisma.bsff.findMany({
      take: PAGE_SIZE,
      orderBy: { rowNumber: "asc" },
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    })
  );

  await iterateOverModelAndCleanEvents("BSVHU", cursor =>
    prisma.bsvhu.findMany({
      take: PAGE_SIZE,
      orderBy: { rowNumber: "asc" },
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    })
  );
}

async function iterateOverModelAndCleanEvents(
  modelName: string,
  getter: (cursor: string | null) => Promise<{ id: string }[]>
) {
  console.info(`Starting to clean events for ${modelName}...`);

  let bsdProcessedCounter = 0;
  let bsdDeletedEventsCounter = 0;
  let cursor: string | null = null;
  let reachedEnd = false;

  do {
    const bsds = await getter(cursor);

    cursor = bsds[bsds.length - 1].id;
    if (bsds.length < PAGE_SIZE) {
      reachedEnd = true;
    }

    for (const bsd of bsds) {
      bsdDeletedEventsCounter += await cleanStreamEvents(bsd.id);
      printProgress(
        `Processed ${modelName}: \x1b[32m${++bsdProcessedCounter}\x1b[0m - Deleted events: \x1b[31m${bsdDeletedEventsCounter}\x1b[0m`
      );
    }
  } while (!reachedEnd);
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
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(text);
}
