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

export async function getStreamEvents(streamId: string) {
  return eventsCollection.findOne({ streamId });
}

export async function appendEvent(tdEvent: Event) {
  return eventsCollection.updateOne(
    { streamId: tdEvent.streamId },
    { $push: { events: tdEvent }, $set: { latestEvent: tdEvent.createdAt } },
    { upsert: true }
  );
}

async function createIndexes() {
  try {
    await eventsCollection.createIndex({ streamId: 1 });
  } catch (err) {
    console.error("Error while creating indexes", err);
  }
}

createIndexes();
