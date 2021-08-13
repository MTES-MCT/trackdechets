import { URL } from "url";
import { unescape } from "querystring";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: { url: getDbUrl() }
  }
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
