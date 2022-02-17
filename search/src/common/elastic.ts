import fs from "fs";
import path from "path";
import { Client } from "@elastic/elasticsearch";

const certPath = path.join(__dirname, "es.cert");
export const elasticSearchClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
  ssl: fs.existsSync(certPath)
    ? { ca: fs.readFileSync(certPath, "utf-8") }
    : undefined
});
