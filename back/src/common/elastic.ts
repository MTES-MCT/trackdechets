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
        // TODO: perhaps it should also be indexed as text?
        type: "keyword"
      },
      status: {
        type: "keyword"
      },
      recipientCompany: {
        properties: {
          siret: {
            // TODO: perhaps it should also be indexed as text?
            type: "keyword"
          },
          name: {
            type: "text"
          }
        }
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
