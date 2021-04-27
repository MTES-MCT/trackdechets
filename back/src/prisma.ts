import { PrismaClient } from "@prisma/client";

const dbUrl = new URL(process.env.DATABASE_URL);
dbUrl.searchParams.set("schema", "default$default");

const prisma = new PrismaClient({
  datasources: {
    db: { url: dbUrl.href }
  }
});
export default prisma;
