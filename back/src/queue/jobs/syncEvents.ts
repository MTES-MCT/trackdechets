import { insertStreamEvents } from "../../events/mongodb";
import { prisma } from "@td/prisma";

const MAX_NB_OF_EVENTS_SYNCED = 100;

export async function syncEventsJob(): Promise<void> {
  const events = await prisma.event.findMany({
    take: MAX_NB_OF_EVENTS_SYNCED
  });

  if (events.length === 0) return Promise.resolve();

  await insertStreamEvents(events);

  // If for some reason this delete fails, the next sync pass should delete the events anyway
  await prisma.event.deleteMany({
    where: { id: { in: events.map(e => e.id) } }
  });
}
