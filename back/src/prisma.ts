import { URL } from "url";
import { unescape } from "querystring";
import { PrismaClient } from "@prisma/client";
import { tracer } from "./tracer";

const prisma = new PrismaClient({
  datasources: {
    db: { url: getDbUrl() }
  },
  log:
    process.env.NODE_ENV !== "test"
      ? [
          {
            emit: "event",
            level: "query"
          },
          {
            emit: "stdout",
            level: "error"
          },
          {
            emit: "stdout",
            level: "info"
          },
          {
            emit: "stdout",
            level: "warn"
          }
        ]
      : []
});

prisma.$use(async (params, next) => {
  const tags = {
    "span.kind": "client",
    "span.type": "sql",
    "prisma.model": params.model,
    "prisma.action": params.action
  };

  return tracer.trace("prisma.query", { tags }, () => next(params));
});

prisma.$on("query", e => {
  const span = tracer.scope().active();

  span?.setTag("prisma.query", e.query);
  span?.setTag("prisma.params", e.params);
  span?.setTag("prisma.duration", e.duration);
});

function getDbUrl() {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    dbUrl.searchParams.set("schema", "default$default");

    return unescape(dbUrl.href); // unescape needed because of the `$`
  } catch (err) {
    return "";
  }
}

export default prisma;
