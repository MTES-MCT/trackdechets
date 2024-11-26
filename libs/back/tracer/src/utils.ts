import { dirname, basename } from "node:path";

export function getAppRootFolderName() {
  const executedFile = process.argv[1]; // path/to/your/script.js
  const entryPointDir = dirname(executedFile); // => path/to/your
  const folder = basename(entryPointDir); // => your

  return folder;
}
