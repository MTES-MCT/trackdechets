import { Event } from "@td/prisma";

// We cannot type with Event, as we get a `Type instantiation is excessively deep and possibly infinite.` error
// It's because of the Prisma.JsonValue type so we get rid of it
type EventLike = Omit<Event, "metadata" | "data"> & {
  data: any;
  metadata: any;
};

export type EventCollection = { _id: string } & Omit<EventLike, "id">;
