import { Client } from "@elastic/elasticsearch";

export const client = new Client({
  node: process.env.ELASTIC_SEARCH_NODE,
  auth: {
    username: process.env.ELASTIC_SEARCH_USERNAME,
    password: process.env.ELASTIC_SEARCH_PASSWORD
  }
});
