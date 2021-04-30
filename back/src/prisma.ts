import { PrismaClient } from "@prisma/client";
import debug from "debug";

const logQuery = debug("prisma:query");
const prisma = new PrismaClient({
  log: [
    {
      level: "query",
      emit: "event"
    }
  ]
});
prisma.$on("query", event => {
  logQuery(`${event.query} took ${event.duration}ms`);
});

export default prisma;
