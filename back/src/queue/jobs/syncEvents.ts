import { insertStreamEvents } from "../../events/mongodb";
import prisma from "../../prisma";

const MAX_NB_OF_EVENTS_SYNC = 500;

export async function syncEventsJob(): Promise<void> {
  return prisma.$transaction(async transaction => {
    const events = await transaction.event.findMany({
      take: MAX_NB_OF_EVENTS_SYNC
    });

    if (events.length === 0) return Promise.resolve();

    await insertStreamEvents(events);

    await transaction.event.deleteMany({
      where: { id: { in: events.map(e => e.id) } }
    });
  });
}
