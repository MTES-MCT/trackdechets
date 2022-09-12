import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { indexQueue, updatesQueue } from "./producers/elastic";
import { mailQueue } from "./producers/mail";
import {
  geocodeCompanyQueue,
  setCompanyDepartementQueue
} from "./producers/company";

export const serverAdapter = new ExpressAdapter();
export const bullBoardPath = `/queue/monitor/${process.env.QUEUE_MONITOR_TOKEN}`;

createBullBoard({
  queues: [
    new BullAdapter(mailQueue),
    new BullAdapter(indexQueue),
    new BullAdapter(updatesQueue),
    new BullAdapter(geocodeCompanyQueue),
    new BullAdapter(setCompanyDepartementQueue)
  ],
  serverAdapter: serverAdapter
});

serverAdapter.setBasePath(bullBoardPath);
