import "dd-trace/init";

import express, { json } from "express";
import { mongodbClient } from "./clients/mongodb";
import { closePsqlClient } from "./clients/psql";
import { getEventsHandler } from "./handlers";
import { startReplicator } from "./replicator";

const port = process.env.EVENTS_PORT || 82;

export const app = express();

app.use(json());

app.get("/ping", (_, res) => res.send("Pong!"));
app.get("/stream/:streamId", getEventsHandler);

app.listen(port, () =>
  console.info(`Events server is running on port ${port}`)
);

startReplicator();

function shutdown() {
  return Promise.all([closePsqlClient(), mongodbClient.close()]).finally(
    process.exit()
  );
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
