import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { initializePoolMetrics } from "./metric";

const { DATABASE_URL } = process.env;

const pool = new Pool({
  connectionString: DATABASE_URL
});

const cleanupMetrics = initializePoolMetrics(pool);
process.on("SIGTERM", () => {
  cleanupMetrics();
});

const adapter = new PrismaPg(pool, { schema: "default$default" });

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV !== "test" ? ["info", "warn", "error"] : []
});

export * from "./types";
