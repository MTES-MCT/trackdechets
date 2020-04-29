import { loadFiles } from "@graphql-toolkit/file-loading";

export interface Updater {
  run(): Promise<any>;
}

const updaters: {
  constructor: any;
  name: string;
  description: string;
}[] = [];

export function registerUpdater(
  name: string,
  description: string = "",
  active: boolean = true
) {
  return (constructor: new () => object) => {
    if (!active) return;
    updaters.push({ constructor, name, description });
  };
}

// Load every uploaders
loadFiles(`${__dirname}/*.ts`);

(async () => {
  // Run them one by one
  for (const updater of updaters) {
    console.info(`=== About to start "${updater.name}" script ===`);
    console.info(`Description: ${updater.description}`);

    const instance = new updater.constructor() as Updater;
    await instance.run();

    console.info(`=== Done with ${updater.name} ===`);
  }
})();
