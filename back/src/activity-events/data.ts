import { ActivityEvent } from ".";
import { prisma } from "@td/prisma";
import { Event, Prisma } from "@prisma/client";
import { getStreamEvents } from "../events/mongodb";
import { EventCollection } from "../events/types";

export async function getStream(
  streamId: string,
  { until }: { until?: Date } = {}
): Promise<ActivityEvent[]> {
  const mongoEventsIds: string[] = [];
  const events: EventCollection[] = [];
  // Events might be dispatched between Psql & Mongo so we fetch from both
  const [stream, psqlEvents] = await Promise.all([
    getStreamEvents(streamId, until).stream(),
    prisma.event.findMany({
      where: {
        streamId,
        ...(until && { createdAt: { lte: until } })
      }
    })
  ]);
  return new Promise<ActivityEvent[]>((resolve, reject) => {
    stream.on("data", (document: EventCollection) => {
      mongoEventsIds.push(document._id);
      events.push(document);
    });

    stream.on("end", () => {
      // Stream has ended, all documents have been processed
      const allEvents = [
        ...events,
        // Some events might be already in Mongo but still in Psql (especially during tests), so we remove duplicates
        ...psqlEvents.filter(evt => !mongoEventsIds.includes(evt.id))
      ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      resolve(
        allEvents?.map(event => ({
          type: event.type,
          actor: event.actor,
          streamId: event.streamId,
          data: event.data as Record<string, unknown>,
          metadata: event.metadata as Record<string, unknown>
        }))
      );
    });

    stream.on("error", error => {
      // Handle any errors that occurred during the streaming
      reject(error);
    });
  });
}

export function dbEventToActivityEvent(
  event: Event | EventCollection
): ActivityEvent {
  return {
    type: event.type,
    actor: event.actor,
    streamId: event.streamId,
    data: event.data as Record<string, unknown>,
    metadata: event.metadata as Record<string, unknown>
  };
}

export function persistEvent(event: ActivityEvent): Promise<Event> {
  return prisma.event.create({
    data: {
      streamId: event.streamId,
      actor: event.actor,
      type: event.type,
      data: event.data as Prisma.InputJsonObject,
      metadata: (event.metadata as Prisma.InputJsonObject) ?? Prisma.DbNull
    }
  });
}
