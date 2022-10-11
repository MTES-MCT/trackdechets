import { ActivityEvent } from ".";
import prisma from "../prisma";
import { Event, Prisma } from "@prisma/client";
import { getStreamEvents } from "../log-events/mongodb";

export async function getStream(
  streamId: string,
  { until }: { until?: Date } = {}
): Promise<ActivityEvent[]> {
  const events = await getStreamEvents(streamId, until);

  return events?.map(event => ({
    type: event.type,
    actor: event.actor,
    streamId: event.streamId,
    data: event.data as Record<string, unknown>,
    metadata: event.metadata as Record<string, unknown>
  }));
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
