import EventEmitter from "events";
import { Request, Response } from "express";

const UPDATE_EVENT = "update";

const updateEventEmitter = new EventEmitter();

export function pushSseUpdate(sirets: Set<string>) {
  updateEventEmitter.emit(UPDATE_EVENT, sirets);
}

export async function sseHandler(req: Request, res: Response) {
  const { siret } = req.params;

  const headers = {
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    "Connection": "keep-alive"
  };
  res.writeHead(200, headers);

  // Tell the client to retry every 30 seconds if connectivity is lost
  res.write("retry: 30000\n\n");
  
  const listener = (sirets: Set<string>) => {
    if (sirets.has(siret)) {
      res.write("data: update\n\n");
    }
  };
  updateEventEmitter.on(UPDATE_EVENT, listener);
  
  req.on("close", () => {
    updateEventEmitter.off(UPDATE_EVENT, listener);
  });
}
