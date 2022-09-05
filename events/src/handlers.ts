import { Request, Response } from "express";
import { getStreamEvents } from "./clients/mongodb";

export async function getEventsHandler(req: Request, res: Response) {
  const { streamId } = req.params;

  if (!streamId) {
    throw new Error("You must pass a stream ID.");
  }

  try {
    const streamEvents = await getStreamEvents(streamId);
    res.json(streamEvents.events);
  } catch (err) {
    console.error(err);
    res.status(400);
    res.send(`An error occurred, cannot fetch events.`);
  }
}
