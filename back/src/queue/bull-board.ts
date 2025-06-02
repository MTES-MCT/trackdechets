import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import {
  favoritesCompanyQueue,
  geocodeCompanyQueue,
  setCompanyDepartementQueue
} from "./producers/company";
import {
  indexQueue,
  bulkIndexQueue,
  bulkIndexMasterQueue
} from "./producers/elastic";
import { updatesQueue } from "./producers/bsdUpdate";
import { operationHooksQueue } from "./producers/operationHook";
import { webhooksQueue } from "./producers/webhooks";
import { gericoQueue } from "./producers/gerico";
import { syncEventsQueue } from "./producers/events";
import { mailQueue } from "./producers/mail";
import { sirenifyQueue } from "./producers/sirenify";
import { administrativeTransferQueue } from "./producers/administrativeTransfer";
import { updateAppendix2Queue } from "./producers/updateAppendix2";
import { registryImportQueue } from "./producers/registryImport";

export const serverAdapter = new ExpressAdapter();
export const bullBoardPath = `/queue/monitor/${process.env.QUEUE_MONITOR_TOKEN}`;

createBullBoard({
  queues: [
    new BullAdapter(mailQueue),
    new BullAdapter(indexQueue),
    new BullAdapter(bulkIndexQueue),
    new BullAdapter(bulkIndexMasterQueue),
    new BullAdapter(updatesQueue),
    new BullAdapter(geocodeCompanyQueue),
    new BullAdapter(setCompanyDepartementQueue),
    new BullAdapter(favoritesCompanyQueue),
    new BullAdapter(syncEventsQueue),
    new BullAdapter(webhooksQueue),
    new BullAdapter(operationHooksQueue),
    new BullAdapter(sirenifyQueue),
    new BullAdapter(gericoQueue),
    new BullAdapter(administrativeTransferQueue),
    new BullAdapter(updateAppendix2Queue),
    new BullAdapter(registryImportQueue)
  ],
  serverAdapter: serverAdapter
});

serverAdapter.setBasePath(bullBoardPath);
