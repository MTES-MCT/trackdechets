import { PrismaClient } from "@prisma/client";
import { unescape } from "node:querystring";
import { URL } from "node:url";
import { collectMetrics } from "./metrics";

const { DATABASE_URL, NODE_ENV } = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export const prisma = new PrismaClient({
  datasources: {
    db: { url: getDbUrlWithSchema(DATABASE_URL) }
  },
  log: process.env.NODE_ENV !== "test" ? ["info", "warn", "error"] : []
});

if (NODE_ENV === "production") {
  collectMetrics(prisma);
}

function getDbUrlWithSchema(rawDatabaseUrl: string) {
  try {
    const dbUrl = new URL(rawDatabaseUrl);
    dbUrl.searchParams.set("schema", "default$default");

    return unescape(dbUrl.href); // unescape needed because of the `$`
  } catch (err) {
    return "";
  }
}
