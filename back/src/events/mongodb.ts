import { MongoClient } from "mongodb";
import { Event } from "@prisma/client";
import { EventCollection } from "./types";
import { WriteErrors } from "./writeErrors";
import logger from "../logging/logger";

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
  const documents = await eventsCollection
    .find({ streamId, ...(lte && { "event.createdAt": { $lte: lte } }) })
    .toArray();

  return documents.map(document => document.event);
}

export async function insertStreamEvents(tdEvents: Event[]) {
  const writeResult = await eventsCollection.bulkWrite(
    tdEvents.map(evt => ({
      insertOne: {
        document: { _id: evt.id, streamId: evt.streamId, event: evt }
      }
    })),
    // During an ordered bulk write, if an error occurs during the processing of an operation,
    // MongoDB returns without processing the remaining operations in the list.
    // In contrast, when ordered is false, MongoDB continues to process remaining write operations in the list.
    { ordered: false }
  );

  // We ignore duplicate key errors - if the event is already in Mongo it's fine
  // Eg: Error during bulkWrite, BulkWriteError: E11000 duplicate key error collection: ...
  const writeErrors = writeResult.getWriteErrors();
  const DUPLICATE_KEY_ERROR_CODE = 11000;
  const errors = writeErrors.filter(
    error => error.code !== DUPLICATE_KEY_ERROR_CODE
  );

  if (errors.length) {
    logger.error(
      `${errors.length} unexpected error(s) occured during insertion in Mongo`,
      errors
    );
    throw new WriteErrors(errors);
  }
}

// Creating indexes in MongoDB is an idempotent operation.
// The index is created only if it doesn't already exist.
async function createIndexes() {
  try {
    await eventsCollection.createIndex({ streamId: 1 });
  } catch (err) {
    logger.error("Error while creating indexes", err);
  }
}

createIndexes();
