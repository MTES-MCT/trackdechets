import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { collectMetrics } from "./metrics";

const { DATABASE_URL, NODE_ENV } = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg(
  { connectionString: DATABASE_URL },
  { schema: "default$default" }
);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV !== "test" ? ["info", "warn", "error"] : []
});

if (NODE_ENV === "production") {
  collectMetrics(prisma);
}
