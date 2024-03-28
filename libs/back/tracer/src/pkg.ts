import { readFileSync, existsSync } from "node:fs";
import { resolve, parse, dirname } from "node:path";

export function findPkg() {
  const cwd = process.cwd();
  const directory = resolve(cwd);
  const res = parse(directory);

  if (!res) return {};

  const { root } = res;

  const filePath = findUp("package.json", root, directory);

  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (e) {
    return {};
  }
}

function findUp(name: string, root: string, directory: string) {
  while (true) {
    const current = resolve(directory, name);

    if (existsSync(current)) return current;

    if (directory === root) return "";

    directory = dirname(directory);
  }
}
