import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const { DATABASE_URL } = process.env;

const adapter = new PrismaPg(
  { connectionString: DATABASE_URL },
  { schema: "default$default" }
);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV !== "test" ? ["info", "warn", "error"] : []
});

export * from "./generated/prisma/client";
