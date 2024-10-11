import { unescape } from "node:querystring";
import objects from "./objects";
import { PrismaClient } from "@prisma/client";

const { DATABASE_URL } = process.env;

/*
  Database clients init
*/

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
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

const prisma = new PrismaClient({
  datasources: {
    db: { url: getDbUrlWithSchema(DATABASE_URL) }
  },
  log: []
});

/*
  The main Run method
*/
const run = async () => {
  for (let index = 0; index < objects.length; index++) {
    try {
      const newObj = objects[index];
      await prisma[newObj.type].create({
        data: newObj.object
      });
      console.log(`saved object ${index + 1}`);
    } catch (error) {
      console.error(error);
    }
  }

  console.log(
    "ALL DONE ! remember to reindex to elastic if needed ( > npx nx run back:reindex-all-bsds-bulk -- -f )"
  );
};

run();
