import { dirname, basename } from "node:path";

export function getAppRootFolderName() {
  const executedFile = process.env.NX_FILE_TO_RUN ?? process.argv[1]; // e.g., apps/ui/dist/main.js
  let entryPointDir = dirname(executedFile); // => apps/ui/dist
  if (basename(entryPointDir) === "dist") {
    entryPointDir = dirname(entryPointDir); // => apps/ui
  }
  const folder = basename(entryPointDir); // => ui
  return folder;
}
