import { Event } from "@prisma/client";

export type EventCollection = {
  streamId: string;
  latestEvent: Date;
  events: Event[];
};
