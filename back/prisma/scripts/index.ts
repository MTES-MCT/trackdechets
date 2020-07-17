import { loadFiles } from "@graphql-tools/load-files";
import { updaters, Updater } from "./helper/helper";

async function loadUpdaters() {
  console.info("⌛ Loading updaters...");

  const loaded = await loadFiles(`${__dirname}/*.ts`);

  console.info(`✅ [${loaded.length}] updaters have been loaded.`);
  console.info(`🔢 [${updaters.length}] updaters are active.`);
}

async function run() {
  await loadUpdaters();

  //Run them one by one
  for (const updater of updaters) {
    console.info(`=== About to start "${updater.name}" script ===`);
    console.info(`Description: ${updater.description}`);

    const instance = new updater.constructor() as Updater;
    await instance.run();

    console.info(`=== Done with ${updater.name} ===`);
  }

  process.exit();
}

run();
