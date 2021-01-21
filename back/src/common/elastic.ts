import { Client } from "@elastic/elasticsearch";

export const index = {
  alias: "documents",
  index: "documents_v1",
  mappings: {
    properties: {
      id: {
        type: "text"
      },
      readableId: {
        type: "text"
      }
    }
  }
};

export const client = new Client({
  node: process.env.ELASTIC_SEARCH_URL,
  auth: {
    username: process.env.ELASTIC_SEARCH_USER,
    password: process.env.ELASTIC_SEARCH_PASSWORD
  }
});
