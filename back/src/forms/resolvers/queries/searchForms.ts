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
  // elastic search doesn't have precise types
  const query: Record<string, any> = {
    bool: {
      filter: [
        {
          term: {
            sirets: args.siret
          }
        }
      ],
      must_not: []
    }
  };

  if (args.status && args.status.length > 0) {
    query.bool.filter.push({
      terms: {
        status: args.status
      }
    });
  }

  if (typeof args.waitingForMe === "boolean") {
    if (args.waitingForMe) {
      query.bool.filter.push({
        term: {
          waitingForSirets: args.siret
        }
      });
    } else {
      query.bool.must_not.push({
        term: {
          waitingForSirets: args.siret
        }
      });
    }
  }

  const {
    body: {
      hits: { hits }
    }
  } = await client.search<SearchResponse<FormSearchResult>>({
    index: index.alias,
    body: {
      size: 10,
      from: 0,
      query
    }
  });

  return hits.map(hit => hit._source);
};

export default searchFormsResolver;
