import { Client } from "@elastic/elasticsearch";

export const index = {
  alias: "forms",
  index: "forms_v1",
  mappings: {
    properties: {
      id: {
        type: "keyword"
      },
      readableId: {
        type: "keyword"
      },
      type: {
        type: "keyword"
      },
      status: {
        type: "keyword"
      },
      emitter: {
        type: "text"
      },
      recipient: {
        type: "text"
      },
      waste: {
        type: "keyword"
      },
      sirets: {
        type: "keyword"
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
