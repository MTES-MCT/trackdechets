import { fileLoader } from "merge-graphql-schemas";

export interface Updater {
  run(): Promise<any>;
}

const updaters: {
  constructor: any;
  name: string;
  description: string;
}[] = [];

export function registerUpdater(name: string, description: string = "") {
  return function(constructor: Function) {
    updaters.push({ constructor, name, description });
  };
}

// Load every uploaders
fileLoader(`${__dirname}/*.ts`);

(async () => {
  // Run them one by one
  for (let updater of updaters) {
    console.info(`=== About to start "${updater.name}" script ===`);
    console.info(`Description: ${updater.description}`);

    const instance = new updater.constructor() as Updater;
    await instance.run();

    console.info(`=== Done with ${updater.name} ===`);
  }
})();
