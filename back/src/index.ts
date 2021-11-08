import { initSubscriptions } from "./events";
import { app, startApolloServer } from "./server";

const port = process.env.API_PORT || 80;

async function start() {
  await startApolloServer();
  app.listen(port, () => console.info(`Server is running on port ${port}`));
  initSubscriptions();
}

start();
