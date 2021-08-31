import { URL } from "url";
import { unescape } from "querystring";
import { PrismaClient } from "@prisma/client";
import { tracer } from "./tracer";

const prisma = new PrismaClient({
  datasources: {
    db: { url: getDbUrl() }
  },
  log: [
    {
      emit: "event",
      level: "query"
    }
  ]
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

prisma.$on("query" as any, async (e: any) => {
  const span = tracer.scope().active();

  span?.setTag("resource.name", e.query);
  console.log(span);
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
