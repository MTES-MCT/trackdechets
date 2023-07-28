import { app, startApolloServer } from "./server";
import { closeQueues } from "./queue/producers";
import { cleanGqlCaches } from "./temp-memory";
import { cpuProfiling, memorySampling } from "./logging/heapSnapshot";
import { envVariables } from "./env";

envVariables.parse(process.env);

async function start() {
  await startApolloServer();
  app.listen(process.env.API_PORT, () =>
    console.info(`Server is running on port ${process.env.API_PORT}`)
  );

  // TODO - To remove. Either completely if it doesnt work or with a better fix if it does
  cleanGqlCaches();

  function shutdown() {
    return closeQueues().finally(process.exit());
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
