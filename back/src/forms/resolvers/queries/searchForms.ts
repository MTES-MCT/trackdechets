import {
  QueryResolvers,
  FormSearchResult
} from "../../../generated/graphql/types";
import { client, index } from "../../../common/elastic";

// complete Typescript example:
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/typescript.html
interface SearchResponse<T> {
  hits: {
    hits: Array<{
      _source: T;
    }>;
  };
}

const searchFormsResolver: QueryResolvers["searchForms"] = async (_, args) => {
  const {
    body: {
      hits: { hits }
    }
  } = await client.search<SearchResponse<FormSearchResult>>({
    index: index.alias,
    body: {
      size: 10,
      from: 0,
      query: {
        bool: {
          filter: [
            {
              term: {
                sirets: args.siret
              }
            },
            {
              terms: {
                status: args.status
              }
            }
          ]
        }
      }
    }
  });

  return hits.map(hit => hit._source);
};

export default searchFormsResolver;
