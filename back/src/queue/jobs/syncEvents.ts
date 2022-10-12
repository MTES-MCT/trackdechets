import { Event } from "@prisma/client";
import { appendStreamEvents } from "../../log-events/mongodb";
import prisma from "../../prisma";

const MAX_NB_OF_EVENTS_SYNC = 500;

export async function syncEventsJob(): Promise<void> {
  return prisma.$transaction(async transaction => {
    const events = await transaction.event.findMany({
      take: MAX_NB_OF_EVENTS_SYNC
    });

    if (events.length === 0) return Promise.resolve();

    const groupedEvents = groupByStreamId(events);
    for (const [streamId, events] of Object.entries(groupedEvents)) {
      await appendStreamEvents(streamId, events);
    }

    await transaction.event.deleteMany({
      where: { id: { in: events.map(e => e.id) } }
    });
  });
}

function groupByStreamId(array: Event[]) {
  return array.reduce<Record<string, Event[]>>((groups, event) => {
    const { streamId } = event;
    if (!groups[streamId]) {
      groups[streamId] = [];
    }

    groups[streamId].push(event);
    return groups;
  }, {});
}
