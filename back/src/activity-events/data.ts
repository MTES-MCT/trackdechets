import { ActivityEvent } from ".";
import prisma from "../prisma";
import { Event, Prisma } from "@prisma/client";

export async function getStream(
  streamId: string,
  { until }: { until?: Date } = {}
): Promise<ActivityEvent[]> {
  const where = {
    streamId,
    ...(until && { occurredAt: { lte: until } })
  };

  const events = await prisma.event.findMany({ where });

  return events?.map(event => ({
    type: event.type,
    actorId: event.actorId,
    streamId: event.streamId,
    data: event.data as Record<string, unknown>,
    metadata: event.metadata as Record<string, unknown>
  }));
}

export function persistEvent(event: ActivityEvent): Promise<Event> {
  return prisma.event.create({
    data: {
      streamId: event.streamId,
      actorId: event.actorId,
      type: event.type,
      data: event.data as Prisma.InputJsonObject,
      metadata: (event.metadata as Prisma.InputJsonObject) ?? Prisma.DbNull
    }
  });
}
