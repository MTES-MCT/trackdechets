import fs from "fs";
import path from "path";

/**
 * To seed the DB, run `ts-node prisma/seed.ts`
 * It looks for a `seed.dev.ts` file and execute it.
 * Content should look something like:
 *
 * ```
 * import { PrismaClient } from "@prisma/client";
 * const prisma = new PrismaClient();
 * const main = async () => { ... }
 *
 * main()
 *   .catch(e => console.error(e))
 *   .finally(() => prisma.disconnect())
 * ```
 */
const seedPath = path.join(__dirname, "seed.dev.ts");

(() => {
  try {
    fs.accessSync(seedPath);
  } catch (err) {
    return;
  }

  import(seedPath);
})();
