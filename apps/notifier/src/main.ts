import cors from "cors";
import express, { json } from "express";
import helmet from "helmet";
import { getUIBaseURL } from "back";
import { startUpdatesConsumer } from "./consumer";
import { sseHandler } from "./handlers/sse";

const UI_BASE_URL = getUIBaseURL();
const port = parseInt(process.env.NOTIFIER_PORT ?? "82", 10);

export const sseApp = express();

sseApp.use(json());
sseApp.use(
  cors({
    origin: UI_BASE_URL,
    credentials: true
  })
);
sseApp.use(helmet());

sseApp.get("/ping", (_, res) => res.send("Pong!"));
sseApp.get("/updates/:siret", sseHandler);

startUpdatesConsumer();

sseApp.listen(port, "0.0.0.0", () =>
  console.info(`TD notifier server is running on port ${port}`)
);
