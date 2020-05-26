import { loadFiles } from "@graphql-tools/load-files";

export interface Updater {
  run(): Promise<any>;
}

const updaters: {
  constructor: any;
  name: string;
  description: string;
}[] = [];

export function registerUpdater(name: string, description = "", active = true) {
  return (constructor: new () => object) => {
    if (!active) return;
    updaters.push({ constructor, name, description });
  };
}

async function loadUpdaters() {
  console.info("⌛ Loading updaters...");
  const loaded = await loadFiles(`${__dirname}/**`);
  console.info(`✅ [${loaded.length}] updaters have been loaded.`);
  console.info(`🔢 [${updaters.length}] updaters are active.`);
}

async function run() {
  await loadUpdaters();

  // Run them one by one
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
