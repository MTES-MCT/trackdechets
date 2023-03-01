import { app, startApolloServer } from "./server";
import { closeQueues } from "./queue/producers";
import { cleanGqlCaches } from "./temp-memory";

const port = process.env.API_PORT || 80;

async function start() {
  await startApolloServer();
  app.listen(port, () => console.info(`Server is running on port ${port}`));

  // TODO - To remove. Either completely if it doesnt work or with a better fix if it does
  cleanGqlCaches();

  function shutdown() {
    return closeQueues().finally(process.exit());
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

if (process.env.TZ !== "Europe/Paris") {
  console.warn(
    "Please explicitly set the `TZ` env variable to `Europe/Paris`."
  );
  process.env.TZ = "Europe/Paris";
}

start();
