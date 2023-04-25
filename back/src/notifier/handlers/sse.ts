import EventEmitter from "events";
import { Request, Response } from "express";

const UPDATE_EVENT = "update";

const updateEventEmitter = new EventEmitter();

export function pushSseUpdate(sirets: Set<string>) {
  updateEventEmitter.emit(UPDATE_EVENT, sirets);
}

const keepAliveMs = 30 * 1000;

export async function sseHandler(req: Request, res: Response) {
  const { siret } = req.params;
  const headers = {
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive"
  };
  res.writeHead(200, headers);

  // Tell the client to retry every 10 seconds if connectivity is lost
  res.write("retry: 10000\n\n");

  const listener = (sirets: Set<string>) => {
    if (sirets.has(siret)) {
      res.write("event: update\n");
      res.write("data: {}\n\n");
    }
  };
  updateEventEmitter.on(UPDATE_EVENT, listener);

  const keepAliveInterval = setInterval(() => {
    res.write(": keep alive\n\n");
  }, keepAliveMs);

  req.on("close", () => {
    updateEventEmitter.off(UPDATE_EVENT, listener);
    clearInterval(keepAliveInterval);
  });
}
