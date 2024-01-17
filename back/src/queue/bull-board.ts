import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import {
  favoritesCompanyQueue,
  geocodeCompanyQueue,
  setCompanyDepartementQueue
} from "./producers/company";
import { indexQueue, bulkIndexQueue } from "./producers/elastic";
import { updatesQueue } from "./producers/bsdUpdate";
import { webhooksQueue } from "./producers/webhooks";
import { syncEventsQueue } from "./producers/events";
import { mailQueue } from "./producers/mail";

export const serverAdapter = new ExpressAdapter();
export const bullBoardPath = `/queue/monitor/${process.env.QUEUE_MONITOR_TOKEN}`;

createBullBoard({
  queues: [
    new BullAdapter(mailQueue),
    new BullAdapter(indexQueue),
    new BullAdapter(bulkIndexQueue),
    new BullAdapter(updatesQueue),
    new BullAdapter(geocodeCompanyQueue),
    new BullAdapter(setCompanyDepartementQueue),
    new BullAdapter(favoritesCompanyQueue),
    new BullAdapter(syncEventsQueue),
    new BullAdapter(webhooksQueue)
  ],
  serverAdapter: serverAdapter
});

serverAdapter.setBasePath(bullBoardPath);
