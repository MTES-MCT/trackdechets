import DataLoader from "dataloader";
import { getStreamsEvents } from "../events/mongodb";
import prisma from "../prisma";
import { dbEventToActivityEvent } from "./data";
import { ActivityEvent } from "./types";

type Key = { streamId: string; lte?: Date };

export function createEventsDataLoaders() {
  return {
    events: new DataLoader((keys: Key[]) => getStreams(keys), {
      cacheKeyFn: ({ streamId, lte }: { streamId: string; lte?: Date }) => {
        return `${streamId}:${lte ? lte.toISOString() : "no-date"}`;
      }
    })
  };
}

/**
 * Get events in a single request per DB.
 * We have to overfetch as:
 * - each streamId can have a different lte date
 * - a streamId can appear several times with different lte dates
 *
 * The work is then done in JS. This still seems worth it as user with a lot of revisions
 * can generate hundreds of requests otherwise.
 *
 * @param keys The streamId & lte combination
 * @returns events corresponding to each streamId & lte
 */
async function getStreams(keys: Key[]): Promise<ActivityEvent[][]> {
  const streamIds = keys.map(key => key.streamId);

  const [mongoEvents, psqlEvents] = await Promise.all([
    getStreamsEvents(streamIds),
    prisma.event.findMany({
      where: {
        streamId: { in: streamIds }
      }
    })
  ]);

  // Initialise response array - each index in the Array of values must correspond to the same index in the Array of keys
  const eventsByKey: ActivityEvent[][] = keys.map(() => []);
  // Initialise lookup table to check for duplicates. `.has()` is O(1) on Sets
  const lookup = keys.map(() => new Set());

  for (const mongoEvent of mongoEvents) {
    const correspondingKeys = keys.filter(
      ({ streamId }) => streamId === mongoEvent.streamId
    );

    for (const key of correspondingKeys) {
      const index = keys.indexOf(key);
      if (lteFilter(key.lte, mongoEvent.createdAt)) {
        eventsByKey[index].push(mongoEvent);
        lookup[index].add(mongoEvent._id);
      }
    }
  }

  for (const psqlEvent of psqlEvents) {
    const correspondingKeys = keys.filter(
      ({ streamId }) => streamId === psqlEvent.streamId
    );

    for (const key of correspondingKeys) {
      const index = keys.indexOf(key);
      // Some events might be already in Mongo but still in Psql (especially during tests),
      // so we remove duplicates
      if (
        !lookup[index].has(psqlEvent.id) &&
        lteFilter(key.lte, psqlEvent.createdAt)
      ) {
        eventsByKey[index].push(dbEventToActivityEvent(psqlEvent));
      }
    }
  }

  return eventsByKey;
}

function lteFilter(lte: Date | undefined, eventCreatedAt: Date) {
  if (!lte) return true;
  return lte >= eventCreatedAt;
}
