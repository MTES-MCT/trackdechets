import { initSubscriptions } from "./subscriptions";
import { server } from "./server";

const port = process.env.BACK_PORT || 80;
const isProd = process.env.NODE_ENV === "production";

export const httpServer = server.start({ port, debug: !isProd }, () =>
  console.log(`Server is running on port ${port}`)
);

initSubscriptions();
