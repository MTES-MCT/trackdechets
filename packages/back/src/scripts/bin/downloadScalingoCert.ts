import path from "path";
import fs from "fs";
import axios from "axios";

(async () => {
  if (process.env.SCALINGO_CERT) {
    const certPath = path.join(__dirname, "..", "..", "common", "es.cert");
    console.log(
      `SCALINGO_CERT is defined, downloading certificate to ${certPath}`
    );

    const { data } = await axios.get<string>(process.env.SCALINGO_CERT);
    fs.writeFileSync(certPath, data);
  } else {
    console.log(`SCALINGO_CERT is undefined, skipping certificate download`);
  }
})();
