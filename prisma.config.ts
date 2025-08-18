import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

const prismaFolder = path.join("libs", "back", "prisma", "src");

export default defineConfig({
  schema: prismaFolder,
  migrations: {
    seed: "tsx --tsconfig back/tsconfig.lib.json back/prisma/seed.ts"
  }
});
