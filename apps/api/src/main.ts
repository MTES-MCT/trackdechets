import { httpServer, startApolloServer } from "back";
import { closeQueues } from "back";
import { cpuProfiling, memorySampling } from "./heapSnapshot";
import { envVariables } from "@td/env";

envVariables.parse(process.env);

async function start() {
  await startApolloServer();
  httpServer.listen(parseInt(process.env.API_PORT, 10), "0.0.0.0", () =>
    console.info(`TD API server is running on port ${process.env.API_PORT}`)
  );

  function shutdown() {
    return closeQueues().finally(() => {
      httpServer.close(() => process.exit());
    });
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  process.on("SIGUSR1", memorySampling);
  process.on("SIGUSR2", cpuProfiling);
}

if (process.env.TZ !== "Europe/Paris") {
  console.warn(
    "Please explicitly set the `TZ` env variable to `Europe/Paris`."
  );
  process.env.TZ = "Europe/Paris";
}

start();
