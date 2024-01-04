import path from "path";
import { prisma } from "@td/prisma";

let exitCode = 0;

(async () => {
  try {
    // the seed.dev file may not exist and TypeScript would prevent us
    // from importing it with a regular import
    // that's why we're using a dynamic import with path.join(),
    // so TypeScript loses track of what's being imported
    const { default: seed } = await import(path.join(__dirname, "seed.dev"));
    await seed();
  } catch (err) {
    console.error(err);
    exitCode = 1;
  }

  await prisma.$disconnect();
  process.exit(exitCode);
})();
