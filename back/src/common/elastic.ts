import fs from "fs";
import path from "path";
import { Client, RequestParams } from "@elastic/elasticsearch";
import { BsdType } from "../generated/graphql/types";
import { GraphQLContext } from "../types";
import { AuthType } from "../auth";
import prisma from "../prisma";
import { Bsda, Bsdasri, Bsff, Bsvhu, Form, Prisma } from "@prisma/client";
import { indexAllForms } from "../forms/elastic";
import { indexAllBsdasris } from "../bsdasris/elastic";
import { indexAllBsvhus } from "../bsvhu/elastic";
import { indexAllBsdas } from "../bsda/elastic";
import { indexAllBsffs } from "../bsffs/elastic";

// complete Typescript example:
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/6.x/_a_complete_example.html
export interface SearchResponse<T> {
  hits: {
    total: number;
    hits: Array<{
      _source: T;
    }>;
  };
}
export interface GetResponse<T> {
  _source: T;
}
export interface BsdElastic {
  type: BsdType;
  id: string;
  createdAt: number;
  readableId: string;
  customId: string;
  emitterCompanyName: string;
  emitterCompanySiret: string;
  transporterCompanyName: string;
  transporterCompanySiret: string;
  transporterTakenOverAt: number;
  wasteCode: string;
  wasteDescription: string;
  transporterNumberPlate?: string[];
  transporterCustomInfo?: string;
  destinationCompanyName: string;
  destinationCompanySiret: string;
  destinationReceptionDate: number;
  destinationReceptionWeight: number;
  destinationOperationCode: string;
  destinationOperationDate: number;

  isDraftFor: string[];
  isForActionFor: string[];
  isFollowFor: string[];
  isArchivedFor: string[];
  isToCollectFor: string[];
  isCollectedFor: string[];
  sirets: string[];

  isIncomingWasteFor: string[];
  isOutgoingWasteFor: string[];
  isTransportedWasteFor: string[];
  isManagedWasteFor: string[];
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
      customId_ngram: {
        type: "ngram",
        token_chars: ["letter", "digit"]
      },
      customId_char_group: {
        type: "char_group",
        tokenize_on_chars: ["whitespace", "-", "_"]
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
  customId: {
    type: "keyword"
  },
  type: {
    type: "keyword"
  },
  emitterCompanyName: {
    type: "text",
    fields: {
      keyword: {
        type: "keyword"
      }
    }
  },
  emitterCompanySiret: {
    type: "keyword"
  },
  transporterCompanyName: {
    type: "text",
    fields: {
      keyword: {
        type: "keyword"
      }
    }
  },
  transporterCompanySiret: {
    type: "keyword"
  },
  transporterTakenOverAt: {
    type: "date"
  },
  destinationCompanyName: {
    type: "text",
    fields: {
      keyword: {
        type: "keyword"
      }
    }
  },
  destinationReceptionDate: {
    type: "date"
  },
  destinationReceptionWeight: {
    type: "float"
  },
  destinationOperationCode: {
    type: "keyword"
  },
  destinationOperationDate: {
    type: "date"
  },
  destinationCompanySiret: {
    type: "keyword"
  },
  wasteCode: {
    type: "keyword",
    fields: {
      ngram: {
        type: "text",
        analyzer: "waste_ngram",
        search_analyzer: "waste_ngram_search"
      }
    }
  },
  wasteDescription: {
    type: "text",
    fields: {
      keyword: {
        type: "keyword"
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
  },
  // établissement pour lesquelles ce BSD doit apparaitre sur le registre de déchets entrants
  isIncomingWasteFor: {
    type: "keyword"
  },
  // établissements pour lesquelles ce BSD doit apparaitre sur le registre de déchets sortants
  isOutgoingWasteFor: {
    type: "keyword"
  },
  // établissements pour lesquelles ce BSD doit apparaitre sur le registre de déchets transportés
  isTransportedWasteFor: {
    type: "keyword"
  },
  // établissements pour lesquelles ce BSD doit apparaitre sur le registre de déchets gérés
  isManagedWasteFor: {
    type: "keyword"
  }
};

export type BsdIndex = {
  index: string;
  alias: string;
  type: string;
  settings: object;
  mappings: {
    properties: typeof properties;
  };
};

export const index: BsdIndex = {
  alias: "bsds",

  // Changing the value of index is a way to "bump" the model
  // Doing so will cause all BSDs to be reindexed in Elastic Search
  // when running the appropriate script
  index: "bsds_0.2.3",

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
    : { refresh: false };
}

/**
 * Create/update a document in Elastic Search.
 */
export function indexBsd(bsd: BsdElastic, ctx?: GraphQLContext) {
  return client.index({
    index: index.index,
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

/**
 * Group BsdElastic by BSD type
 */
function groupByBsdType(
  bsdsELastic: BsdElastic[]
): Record<BsdType, BsdElastic[]> {
  return bsdsELastic.reduce<Record<BsdType, BsdElastic[]>>(
    (acc, bsdElastic) => ({
      ...acc,
      [bsdElastic.type]: [...acc[bsdElastic.type], bsdElastic]
    }),
    { BSDD: [], BSDASRI: [], BSVHU: [], BSDA: [], BSFF: [] }
  );
}

export type PrismaBsdMap = {
  bsdds: Form[];
  bsdasris: Bsdasri[];
  bsvhus: Bsvhu[];
  bsdas: Bsda[];
  bsffs: Bsff[];
};

type PrismaBsdsInclude = {
  BSDD?: Prisma.FormInclude;
  BSDASRI?: Prisma.BsdasriInclude;
  BSDA?: Prisma.BsdaInclude;
  BSFF?: Prisma.BsffInclude;
};

/**
 * Convert a list of BsdElastic to a mapping of prisma Bsds
 */
export async function toPrismaBsds(
  bsdsElastic: BsdElastic[],
  include: PrismaBsdsInclude = {}
): Promise<PrismaBsdMap> {
  const { BSDD, BSDASRI, BSVHU, BSDA, BSFF } = groupByBsdType(bsdsElastic);
  const prismaBsdsPromises: [
    Promise<Form[]>,
    Promise<Bsdasri[]>,
    Promise<Bsvhu[]>,
    Promise<Bsda[]>,
    Promise<Bsff[]>
  ] = [
    prisma.form.findMany({
      where: {
        id: {
          in: BSDD.map(bsdd => bsdd.id)
        }
      },
      ...(include.BSDD ? { include: include.BSDD } : {})
    }),
    prisma.bsdasri.findMany({
      where: { id: { in: BSDASRI.map(bsdasri => bsdasri.id) } },
      ...(include.BSDASRI ? { include: include.BSDASRI } : {})
    }),
    prisma.bsvhu.findMany({
      where: {
        id: {
          in: BSVHU.map(bsvhu => bsvhu.id)
        }
      }
    }),
    prisma.bsda.findMany({
      where: {
        id: {
          in: BSDA.map(bsda => bsda.id)
        }
      },
      ...(include.BSDA ? { include: include.BSDA } : {})
    }),
    prisma.bsff.findMany({
      where: {
        id: {
          in: BSFF.map(bsff => bsff.id)
        }
      },
      ...(include.BSFF ? { include: include.BSFF } : {})
    })
  ];

  const [bsdds, bsdasris, bsvhus, bsdas, bsffs] = await Promise.all(
    prismaBsdsPromises
  );
  return { bsdds, bsdasris, bsvhus, bsdas, bsffs };
}

export async function indexAllBsds(index: string) {
  await indexAllForms(index);
  await indexAllBsdasris(index);
  await indexAllBsvhus(index);
  await indexAllBsdas(index);
  await indexAllBsffs(index);
}
