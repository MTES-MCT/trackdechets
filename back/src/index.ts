import { initSubscriptions } from "./events";
import { app, startApolloServer } from "./server";
import { closeMailQueue } from "./queue/producers/mail";

const port = process.env.API_PORT || 80;

async function start() {
  await startApolloServer();
  app.listen(port, () => console.info(`Server is running on port ${port}`));
  initSubscriptions();

  function shutdown() {
    return closeMailQueue().finally(process.exit());
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
