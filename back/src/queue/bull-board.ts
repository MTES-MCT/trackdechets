import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { mailQueue } from "./producer";

export const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: [new BullAdapter(mailQueue)],
  serverAdapter: serverAdapter
});

serverAdapter.setBasePath("/queue/monitor/eradicate-override-facsimile-track");
