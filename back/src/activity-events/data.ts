import { ActivityEvent } from ".";
import prisma from "../prisma";
import { Event } from "@prisma/client";

export async function getStream(
  streamId: string,
  { until }: { until?: Date } = {}
): Promise<ActivityEvent[]> {
  const where = {
    streamId,
    ...(until && { occuredAt: { lte: until } })
  };

  const events = await prisma.event.findMany({ where });

  return events?.map(event => ({
    type: event.type,
    actorId: event.actorId,
    streamId: event.streamId,
    data: event.data as any,
    metadata: event.metadata as any
  }));
}

export function persistEvent(event: ActivityEvent): Promise<Event> {
  return prisma.event.create({
    data: {
      occurredAt: new Date(),
      streamId: event.streamId,
      actorId: event.actorId,
      type: event.type,
      data: event.data as any,
      metadata: event.metadata as any
    }
  });
}
