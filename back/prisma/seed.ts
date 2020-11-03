import fs from "fs";
import path from "path";

const seedPath = path.join(__dirname, "seed.dev.ts");

(() => {
  try {
    fs.accessSync(seedPath);
  } catch (err) {
    return;
  }

  import(seedPath);
})();
