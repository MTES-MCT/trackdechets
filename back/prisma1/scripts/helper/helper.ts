export interface Updater {
  run(): Promise<any>;
}

export const updaters: {
  constructor: any;
  name: string;
  description: string;
}[] = [];

export function registerUpdater(name: string, description = "", active = true) {
  return (constructor: new () => Updater) => {
    if (!active) return;
    updaters.push({ constructor, name, description });
  };
}
