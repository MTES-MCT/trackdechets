import { initSubscriptions } from "./events";
import { app, startApolloServer } from "./server";
import { closeMailQueue } from "./queue/producer";

const port = process.env.API_PORT || 80;

async function start() {
  await startApolloServer();
  app.listen(port, () => console.info(`Server is running on port ${port}`));
  initSubscriptions();

  const shutdown = async () => {
    await closeMailQueue();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start();
