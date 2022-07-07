import cors from "cors";
import express, { json } from "express";
import { getUIBaseURL } from "../utils";
import { startUpdatesConsumer } from "./consumer";
import { sseHandler } from "./sseHandler";

const UI_BASE_URL = getUIBaseURL();
const port = process.env.NOTIFIER_PORT || 82;

export const sseApp = express();

sseApp.use(json());
sseApp.use(
  cors({
    origin: UI_BASE_URL,
    credentials: true
  })
);

sseApp.get("/ping", (_, res) => res.send("Pong!"));
sseApp.get("/updates/:siret", sseHandler);

startUpdatesConsumer();

sseApp.listen(port, () =>
  console.info(`Updates server is running on port ${port}`)
);
