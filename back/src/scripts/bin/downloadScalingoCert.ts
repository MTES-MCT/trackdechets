import path from "path";
import fs from "fs";
import axios from "axios";

(async () => {
  if (process.env.SCALINGO_CERT) {
    const { data } = await axios.get(process.env.SCALINGO_CERT);
    fs.writeFileSync(
      path.join(__dirname, "..", "..", "common", "es.cert"),
      data
    );
  }
})();
