import seed from "./seed.dev";
import prisma from "../src/prisma";

let exitCode = 0;

seed()
  .catch(async e => {
    console.log(e);
    exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(exitCode);
  });
