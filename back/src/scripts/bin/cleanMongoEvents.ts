import { closeMongoClient } from "../../events/mongodb";
import { prisma } from "@td/prisma";
import { cleanMongoEvents } from "./cleanMongoEvents.helper";

cleanMongoEvents()
  .then(() => process.exit())
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await closeMongoClient();
  });
