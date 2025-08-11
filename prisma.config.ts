import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

const prismaFolder = path.join("libs", "back", "prisma", "src");

export default defineConfig({
  schema: path.join(prismaFolder, "schema.prisma"),
  migrations: {
    path: path.join(prismaFolder, "migrations"),
    seed: "tsx --tsconfig back/tsconfig.lib.json back/prisma/seed.ts"
  }
});
