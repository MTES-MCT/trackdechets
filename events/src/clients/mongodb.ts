import { MongoClient } from "mongodb";
import { EventCollection, TDEvent } from "../types";

const { MONGODB_URL } = process.env;
const DB_NAME = "td_events";
const EVENTS_COLLECTION = "events";

export const mongodbClient = new MongoClient(MONGODB_URL);

const database = mongodbClient.db(DB_NAME);
const eventsCollection =
  database.collection<EventCollection>(EVENTS_COLLECTION);

export async function getStreamEvents(streamId: string) {
  return eventsCollection.findOne({ streamId });
}

export async function appendEvent(tdEvent: TDEvent) {
  return eventsCollection.updateOne(
    { _id: tdEvent.streamId },
    { $push: { events: tdEvent }, $set: { latestEvent: tdEvent.createdAt } },
    { upsert: true }
  );
}
