import fs from "fs";
import path from "path";
import { Client } from "@elastic/elasticsearch";

const certPath = path.join(__dirname, "es.cert");

let ssl = undefined;

if (fs.existsSync(certPath)) {
  ssl = { ca: fs.readFileSync(certPath, "utf-8") };
} else if (process.env.TD_COMPANY_ELASTICSEARCH_CACERT) {
  ssl = { ca: process.env.TD_COMPANY_ELASTICSEARCH_CACERT };
}

// bypass ssl verif
if (!!ssl && process.env.TD_COMPANY_ELASTICSEARCH_IGNORE_SSL === "true") {
  ssl.rejectUnauthorized = false;
}

const client = new Client({
  node: process.env.TD_COMPANY_ELASTICSEARCH_URL || "http://elasticsearch:9200",
  ssl
});

export default client;
