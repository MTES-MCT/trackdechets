import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const seedPath = path.join(__dirname, "seed.dev.ts");

const prisma = new PrismaClient();

// A `main` function so that we can use async/await
async function main() {
  try {
    fs.accessSync(seedPath);
  } catch (err) {
    throw new Error("Aucun fichier `prisma/seed.dev.ts`");
  }
  const seed = (await import(seedPath)).default;
  await seed();
}

let exitCode = 0;

main()
  .catch(async e => {
    console.log(e);
    exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(exitCode);
  });
