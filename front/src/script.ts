import * as fs from "fs";
import * as path from "path";

const rootFolders = [
  "account/",
  "admin/",
  "Apps/",
  "common/",
  "company/",
  "dashboard/",
  "form/",
  "login/",
  "oauth/",
  "Pages/",
  "scss/",
  "search/",
  "stories/"
];
const currentDir = process.cwd();

function processFile(filePath: string) {
  const fileContent = fs.readFileSync(filePath, "utf-8");

  const updatedContent = fileContent.replace(
    // /from\s+['"](\S+)['"]/g, => import { } from ""
    /import\(['"](\S+)['"]\)/g, // => import("")
    (_match, importPath) => {
      if (rootFolders.some(root => importPath.startsWith(root))) {
        const relativePath = path.relative(
          path.dirname(filePath),
          path.join(currentDir, importPath)
        );
        // return `from "${relativePath}"`;
        return `import("${relativePath}")`;
      } else {
        return _match; // Do not modify the import
      }
    }
  );

  fs.writeFileSync(filePath, updatedContent, "utf-8");
}

function processDirectory(dirPath: string) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      processDirectory(filePath);
    } else if (
      stats.isFile() &&
      (filePath.endsWith(".ts") || filePath.endsWith(".tsx"))
    ) {
      processFile(filePath);
      console.log(`Processed: ${filePath}`);
    }
  }
}

console.log(`Starting to process files in ${currentDir}...`);
processDirectory(currentDir);
console.log("All files processed.");
