import fs from "fs";
import path from "path";
import { Client, RequestParams } from "@elastic/elasticsearch";
import { BsdType } from "../generated/graphql/types";
import { GraphQLContext } from "../types";
import { AuthType } from "../auth";

export interface BsdElastic {
  id: string;
  readableId: string;
  type: BsdType;
  emitter: string;
  recipient: string;
  waste: string;
  transporterNumberPlate?: string[];
  transporterCustomInfo?: string;
  createdAt: number;

  isDraftFor: string[];
  isForActionFor: string[];
  isFollowFor: string[];
  isArchivedFor: string[];
  isToCollectFor: string[];
  isCollectedFor: string[];
  sirets: string[];
}

// Custom analyzers for readableId and waste fields
// See https://www.elastic.co/guide/en/elasticsearch/reference/6.8/analysis-ngram-tokenizer.html
const settings = {
  analysis: {
    analyzer: {
      // BSD-20210101-H7F59G71G => [bs, bsd, sd, 20, 201, ..., 20210101, ..., h7f59g71, hf59g71g]
      readableId: {
        tokenizer: "readableId_ngram",
        filter: ["lowercase"]
      },
      // BSD-20210101-H7F59G71G => [bsd, 20210101, hf59g71g]
      // H7F5 => [h7f5]
      readableId_search: {
        tokenizer: "readableId_char_group",
        filter: ["lowercase"]
      },
      waste_text: {
        tokenizer: "letter", // remove waste code from index
        filter: ["lowercase", "asciifolding", "stemmer"]
      },
      // 01 01 01* => ["01", "01 ", "1 ", .. "01 01 01*"]
      waste_ngram: {
        tokenizer: "waste_ngram"
      },
      // accepts whatever text it is given and outputs the exact same text as a single term
      waste_ngram_search: {
        tokenizer: "keyword"
      },
      numberPlate: {
        tokenizer: "numberPlate_ngram",
        filter: ["lowercase"]
      },
      numberPlate_search: {
        tokenizer: "numberPlate_char_group",
        filter: ["lowercase"]
      }
    },
    tokenizer: {
      readableId_ngram: {
        type: "ngram",
        min_gram: 2,
        max_gram: 9, // max token length is the random part of the readableId
        token_chars: ["letter", "digit"] // split on "-"
      },
      readableId_char_group: {
        type: "char_group",
        tokenize_on_chars: ["whitespace", "-"]
      },
      waste_ngram: {
        type: "ngram",
        min_gram: 1, // allow to search on "*" to get dangerous waste only
        max_gram: 9, // "xx xx xx*" is 9 char length
        // do not include letter in `token_chars` to discard waste description from the index
        token_chars: ["digit", "whitespace", "punctuation", "symbol"]
      },
      numberPlate_ngram: {
        type: "ngram",
        min_gram: 2,
        max_gram: 3,
        token_chars: ["letter", "digit"]
      },
      numberPlate_char_group: {
        type: "char_group",
        tokenize_on_chars: ["whitespace", "-"]
      }
    }
  }
};

const properties: Record<keyof BsdElastic, Record<string, unknown>> = {
  // "keyword" is used for exact matches
  // "text" for fuzzy matches
  // but it's not possible to sort on "text" fields
  // so that's why text fields have a secondary field "keyword" used to sort
  id: {
    type: "keyword"
  },
  readableId: {
    type: "text",
    analyzer: "readableId",
    search_analyzer: "readableId_search",
    fields: {
      keyword: {
        type: "keyword"
      }
    }
  },
  type: {
    type: "keyword"
  },
  emitter: {
    type: "text",
    fields: {
      keyword: {
        type: "keyword"
      }
    }
  },
  recipient: {
    type: "text",
    fields: {
      keyword: {
        type: "keyword"
      }
    }
  },
  waste: {
    type: "text",
    analyzer: "waste_text",
    fields: {
      keyword: {
        type: "keyword"
      },
      ngram: {
        type: "text",
        analyzer: "waste_ngram",
        search_analyzer: "waste_ngram_search"
      }
    }
  },
  transporterNumberPlate: {
    type: "text",
    analyzer: "numberPlate",
    search_analyzer: "numberPlate_search",
    fields: {
      keyword: {
        type: "keyword"
      }
    }
  },
  transporterCustomInfo: {
    type: "text",
    fields: {
      keyword: {
        type: "keyword"
      }
    }
  },
  createdAt: {
    type: "date"
  },
  isDraftFor: {
    type: "keyword"
  },
  isFollowFor: {
    type: "keyword"
  },
  isForActionFor: {
    type: "keyword"
  },
  isArchivedFor: {
    type: "keyword"
  },
  isToCollectFor: {
    type: "keyword"
  },
  isCollectedFor: {
    type: "keyword"
  },
  sirets: {
    type: "keyword"
  }
};

export const index = {
  alias: "bsds",

  // Changing the value of index is a way to "bump" the model
  // Doing so will cause all BSDs to be reindexed in Elastic Search
  // when running the appropriate script
  index: "bsds_0.1.3",

  // The next major version of Elastic Search doesn't use "type" anymore
  // so while it's required for the current version, we are not using it too much
  type: "_doc",
  settings,
  mappings: {
    properties
  }
};

/**
 * Returns the keyword field matching the given fieldName.
 *
 * e.g passing "readableId" returns "readableId.keyword",
 *     because "redableId" is a "text" with a sub field "readableId.keyword" which is a keyword.
 *
 * e.g passing "id" returns "id", because it's already a keyword.
 *
 * This is useful for context where we are given a property but need to use its keyword counterpart.
 * For example when sorting, where it's not possible to sort on text fields.
 */
export function getKeywordFieldNameFromName(
  fieldName: keyof BsdElastic
): string {
  const property = index.mappings.properties[fieldName];

  if (property.type === "keyword") {
    // this property is of type "keyword" itself, it can be used as such
    return fieldName;
  }

  // look for a sub field with the type "keyword"
  const [subFieldName] =
    Object.entries(property.fields || {}).find(
      ([_, property]) => property.type === "keyword"
    ) ?? [];

  if (subFieldName == null) {
    throw new Error(
      `The field "${fieldName}" is not of type "keyword" and has no sub fields of that type.`
    );
  }

  return `${fieldName}.${subFieldName}`;
}

/**
 * Returns the root field name matching keywordFieldName.
 * It's the opposite of getKeywordFieldNameFromName.
 *
 * e.g passing "readableId.keyword" returns "readableId",
 *     because "readableId.keyword" is a sub field, the actual field is "readableId".
 *
 * e.g passing "id" returns "id", because "id" is the root field.
 *
 * This is useful for context where a key has been turned into its keyword counterpart
 * but we need to access the value of a document based on it.
 * For example when constructing the "search_after" array from the "sort" array.
 */
export function getFieldNameFromKeyword(
  keywordFieldName: string
): keyof BsdElastic {
  const [fieldName] = keywordFieldName.split(".");

  if (index.mappings.properties[fieldName] == null) {
    throw new Error(
      `The field "${keywordFieldName}" doesn't match a property declared in the mappings.`
    );
  }

  return fieldName as keyof BsdElastic;
}

const certPath = path.join(__dirname, "es.cert");
export const client = new Client({
  node: process.env.ELASTIC_SEARCH_URL,
  ssl: fs.existsSync(certPath)
    ? { ca: fs.readFileSync(certPath, "utf-8") }
    : undefined
});

/**
 * Set refresh parameter to `wait_for` when user is logged in from UI
 * It allows to refresh the BSD list in real time after a create, update or delete operation from UI
 * https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-refresh.html
 */
function refresh(ctx?: GraphQLContext): Partial<RequestParams.Index> {
  return ctx?.user?.auth === AuthType.Session
    ? { refresh: "wait_for" }
    : { refresh: "false" };
}

/**
 * Create/update a document in Elastic Search.
 */
export function indexBsd(bsd: BsdElastic, ctx?: GraphQLContext) {
  return client.index({
    index: index.alias,
    type: index.type,
    id: bsd.id,
    body: bsd,
    ...refresh(ctx)
  });
}

/**
 * Bulk create/update a list of documents in Elastic Search.
 */
export function indexBsds(idx: string, bsds: BsdElastic[]) {
  return client.bulk({
    body: bsds.flatMap(bsd => [
      {
        index: {
          _index: idx,
          _type: index.type,
          _id: bsd.id
        }
      },
      bsd
    ])
  });
}

/**
 * Delete a document in Elastic Search.
 */
export function deleteBsd<T extends { id: string }>(
  { id }: T,
  ctx?: GraphQLContext
) {
  return client.delete(
    {
      index: index.alias,
      type: index.type,
      id,
      ...refresh(ctx)
    },
    { ignore: [404] }
  );
}
