import { appendEvent } from "./clients/mongodb";
import { deleteEvents, getOldestEvents } from "./clients/psql";

const REPLICATION_INTERVAL = 5 * 1000;
const BATCH_SIZE = 100;

export async function startReplicator() {
  console.info(
    `Starting Trackdéchets events replication, with ${REPLICATION_INTERVAL}ms between each run.`
  );

  await migrateEvents();
}

async function migrateEvents() {
  try {
    await recursiveMigrateEvents();
  } catch (err) {
    console.error("An error occurred during replication", err);
  }

  setTimeout(migrateEvents, REPLICATION_INTERVAL);
}

async function recursiveMigrateEvents() {
  const { events, count } = await getOldestEvents(BATCH_SIZE);

  if (count === 0) return Promise.resolve();

  for (const event of events) {
    await appendEvent(event);
  }

  await deleteEvents(events.map(e => e.id));

  if (count === BATCH_SIZE) {
    return recursiveMigrateEvents();
  }

  return Promise.resolve();
}
