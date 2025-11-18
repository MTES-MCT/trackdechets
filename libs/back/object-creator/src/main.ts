import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@td/prisma";
import objects from "./objects";

const { DATABASE_URL } = process.env;

/*
  Database clients init
*/

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg(
  { connectionString: DATABASE_URL },
  { schema: "default$default" }
);

const prisma = new PrismaClient({
  adapter,
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
