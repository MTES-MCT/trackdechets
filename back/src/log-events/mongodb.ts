import { MongoClient } from "mongodb";
import { Event } from "@prisma/client";
import { EventCollection } from "./types";

const { MONGODB_URL } = process.env;

const DB_NAME = "td_events";
const EVENTS_COLLECTION = "events";

export const mongodbClient = new MongoClient(MONGODB_URL);

const database = mongodbClient.db(DB_NAME);
const eventsCollection =
  database.collection<EventCollection>(EVENTS_COLLECTION);

export async function closeMongoClient() {
  if (!mongodbClient) return Promise.resolve();

  return mongodbClient.close();
}

export async function getStreamEvents(streamId: string, lte?: Date) {
  const { events } = await eventsCollection.findOne({ _id: streamId });

  return events
    .filter(evt => !lte || evt.createdAt <= lte)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function appendStreamEvents(streamId: string, tdEvents: Event[]) {
  const latestEvent = tdEvents
    .map(event => event.createdAt)
    .sort()
    .pop();

  return eventsCollection.updateOne(
    { _id: streamId },
    { $push: { events: { $each: tdEvents } }, $set: { latestEvent } },
    { upsert: true }
  );
}
