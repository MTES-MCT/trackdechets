import { readFileSync, existsSync } from "node:fs";
import { resolve, parse, dirname } from "node:path";

export function findPkg(): { name: string | undefined } {
  const projectRoot = findRoot();
  const parsedDirectoryPath = parse(projectRoot);

  if (!parsedDirectoryPath) {
    return { name: undefined };
  }

  const filePath = findUp(
    "package.json",
    parsedDirectoryPath.root,
    projectRoot
  );

  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as {
      name: string | undefined;
    };
  } catch (_) {
    return { name: undefined };
  }
}

function findRoot() {
  const executedFile = process.argv[1];
  if (executedFile.endsWith(".js")) {
    return dirname(executedFile);
  }

  return process.cwd();
}

function findUp(name: string, root: string, directory: string) {
  const current = resolve(directory, name);

  if (existsSync(current)) return current;

  if (directory === root) return "";

  return findUp(name, root, dirname(directory));
}
