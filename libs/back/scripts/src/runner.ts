import { readdir } from "node:fs/promises";
import { parse, join } from "node:path";
import { prisma } from "@td/prisma";
import { Prisma } from "@td/prisma";

export type Script = {
  run: (tx: Prisma.TransactionClient) => Promise<void>;
};

(async () => {
  try {
    await runScripts();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();

async function runScripts() {
  const existingScripts = await prisma.migrationScript.findMany();

  const erroredScripts = existingScripts.filter(m => m.error !== null);

  if (erroredScripts.length > 0) {
    throw new Error(
      `⚠️ Some scripts have failed, please fix them before running other scripts\n${erroredScripts
        .map(script => `Name: ${script.name} / Error: ${script.error}`)
        .join(`\n`)}`
    );
  }

  const scriptsDirectory = join(__dirname, "scripts");
  const scriptFiles = await readdir(scriptsDirectory);

  const newScripts = scriptFiles.filter(file => {
    const fileInfo = parse(file);

    if (fileInfo.ext !== ".ts") {
      throw new Error("❌ Only .ts files are supported for migration scripts");
    }

    return !existingScripts.some(script => script.name === fileInfo.name);
  });

  if (newScripts.length === 0) {
    console.info("ℹ️ No new migration script to run.");
    return;
  }
  console.info(`ℹ️ Found ${newScripts.length} script to run...`);

  for (const file of newScripts) {
    const scriptFilePath = join(scriptsDirectory, file);
    const scriptModule: Script = await import(scriptFilePath);

    if (!scriptModule.run || typeof scriptModule.run !== "function") {
      throw new Error(
        `❌ Invalid migration script file "${file}", missing 'run' function. Aborting.`
      );
    }

    const fileName = parse(file).name;
    console.info(`⌛️ Running script "${fileName}"`);

    await prisma.$transaction(
      async tx => {
        const migrationScript = await tx.migrationScript.create({
          data: {
            name: fileName,
            startedAt: new Date()
          }
        });

        try {
          await scriptModule.run(tx);

          await tx.migrationScript.update({
            where: { id: migrationScript.id },
            data: { finishedAt: new Date() }
          });
          console.log(`✅ Completed execution of "${fileName}"`);
        } catch (error) {
          console.error(`🚨 Error executing script "${fileName}"`, error);

          await tx.migrationScript.update({
            where: { id: migrationScript.id },
            data: { error: String(error) }
          });
        }
      },
      {
        timeout: 600_000
      }
    );
  }

  console.info("✅ Data migrations completed.");
}
