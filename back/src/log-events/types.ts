import { Event } from "@prisma/client";

export type EventCollection = {
  _id: string; // Holds the psql streamId
  latestEvent: Date;
  events: Event[];
};
