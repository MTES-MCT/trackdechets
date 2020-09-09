import fs from "fs";
import path from "path";

(() => {
  try {
    fs.accessSync(path.join(__dirname, "seed.dev.ts"));
  } catch (err) {
    return;
  }

  import("./seed.dev");
})();
