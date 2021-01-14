import { FormSearchResult } from "../generated/graphql/types";
import { client } from "./client";

// complete Typescript example:
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/typescript.html
interface SearchResponse<T> {
  hits: {
    hits: Array<{
      _source: T;
    }>;
  };
}

export async function searchForms(): Promise<FormSearchResult[]> {
  const {
    body: {
      hits: { hits }
    }
  } = await client.search<SearchResponse<FormSearchResult>>({
    index: process.env.ELASTIC_SEARCH_INDEX,
    body: {
      size: 10,
      from: 0,
      query: {
        match_all: {}
      }
    }
  });
  return hits.map(hit => hit._source);
}
