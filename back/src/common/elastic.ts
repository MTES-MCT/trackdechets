import fs from "fs";
import path from "path";
import { Client, RequestParams } from "@elastic/elasticsearch";
import { GraphQLContext } from "../types";
import { AuthType } from "../auth";
import logger from "../logging/logger";
import { BsdType, FormCompany } from "../generated/graphql/types";
import { OperationMode } from "@prisma/client";
import { FormForElastic } from "../forms/elastic";
import { BsdaForElastic } from "../bsda/elastic";
import { BsdasriForElastic } from "../bsdasris/elastic";
import { BsvhuForElastic } from "../bsvhu/elastic";
import { BsffForElastic } from "../bsffs/elastic";

export interface BsdElastic {
  type: BsdType;

  id: string;
  readableId: string;

  createdAt: number;
  updatedAt: number;

  customId: string;

  status: string;

  wasteCode: string;
  wasteAdr: string;
  wasteDescription: string;
  packagingNumbers: string[];
  wasteSealNumbers: string[];
  identificationNumbers: string[];
  ficheInterventionNumbers: string[];

  emitterCompanyName: string;
  emitterCompanySiret: string;
  emitterCompanyAddress: string;
  emitterPickupSiteName: string;
  emitterPickupSiteAddress: string;
  emitterCustomInfo: string;

  workerCompanyName: string;
  workerCompanySiret: string;
  workerCompanyAddress: string;

  transporterCompanyName: string;
  transporterCompanySiret: string;
  transporterCompanyVatNumber: string;
  transporterCompanyAddress: string;
  transporterCustomInfo: string;
  transporterTransportPlates: string[];

  destinationCompanyName: string;
  destinationCompanySiret: string;
  destinationCompanyAddress: string;
  destinationCustomInfo: string;
  destinationCap: string;

  brokerCompanyName: string;
  brokerCompanySiret: string;
  brokerCompanyAddress: string;

  traderCompanyName: string;
  traderCompanySiret: string;
  traderCompanyAddress: string;

  ecoOrganismeName: string;
  ecoOrganismeSiret: string;

  nextDestinationCompanyName: string;
  nextDestinationCompanySiret: string;
  nextDestinationCompanyVatNumber: string;
  nextDestinationCompanyAddress: string;

  destinationOperationCode: string;
  destinationOperationMode: OperationMode | undefined;

  emitterEmissionDate: number | undefined;
  workerWorkDate: number | undefined;
  transporterTransportTakenOverAt: number | undefined;
  destinationReceptionDate: number | undefined;
  destinationAcceptationDate: number | undefined;
  destinationAcceptationWeight: number | null;
  destinationOperationDate: number | undefined;

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
  // Liste des établissements concernés par une demande de révision en cours sur ce bordereau
  isInRevisionFor: string[];
  // Liste des établissements concernés par une demande de révision passée sur ce bordereau
  isRevisedFor: string[];

  intermediaries?: FormCompany[] | null;

  rawBsd:
    | FormForElastic
    | BsdaForElastic
    | BsdasriForElastic
    | BsvhuForElastic
    | BsffForElastic;
}

const textField = {
  type: "text",
  fields: {
    ngram: {
      type: "text",
      analyzer: "ngram_analyzer",
      search_analyzer: "ngram_search"
    }
  }
};

const stringField = {
  type: "keyword",
  normalizer: "lowercase",
  fields: {
    ngram: {
      type: "text",
      analyzer: "ngram_analyzer",
      search_analyzer: "ngram_search"
    }
  }
};

const dateField = { type: "date" };

const numericField = {
  type: "float"
};

const rawField = {
  // enabled false only compatible with object type on ES 6.8
  type: "object",
  // store, do not index
  enabled: false
};

const settings = {
  index: {
    max_ngram_diff: 4
  },
  analysis: {
    analyzer: {
      ngram_analyzer: {
        tokenizer: "ngram_tokenizer",
        filter: ["lowercase"]
      },
      ngram_search: {
        tokenizer: "char_group",
        filter: ["lowercase"]
      }
    },
    tokenizer: {
      // Ngram are used to perform substring match without relying to wildcard queries
      // See https://stackoverflow.com/questions/6467067/how-to-search-for-a-part-of-a-word-with-elasticsearch
      // We use different analyzers at index time and search time.
      // Example with the following string : "BEN"
      // At index time => [b, e, n, be, en, ben]
      // At search time if the search query is "BE" => [be] and it match !
      // To avoid having a high max_gram (14 for siret number) which will take a lot of disk space we split the
      // search query every 5 characters see bsds/where.ts
      // There is a small risk of false positive by permutation though
      // Ex searching for BENGUI => [BENGU, I] will match IBENGU
      ngram_tokenizer: {
        type: "ngram",
        min_gram: 1,
        max_gram: 5,
        token_chars: ["letter", "digit", "symbol", "punctuation"]
      },
      char_group: {
        type: "char_group",
        tokenize_on_chars: ["whitespace"]
      }
    },
    normalizer: {
      lowercase: {
        type: "custom",
        filter: ["lowercase"]
      }
    }
  }
};

const properties: Record<keyof BsdElastic, Record<string, unknown>> = {
  type: stringField,
  id: stringField,
  readableId: stringField,
  createdAt: dateField,
  updatedAt: dateField,
  customId: stringField,
  status: stringField,
  wasteCode: stringField,
  wasteAdr: textField,
  wasteDescription: textField,
  packagingNumbers: stringField,
  wasteSealNumbers: stringField,
  identificationNumbers: stringField,
  ficheInterventionNumbers: stringField,

  emitterCompanyName: textField,
  emitterCompanySiret: stringField,
  emitterCompanyAddress: textField,
  emitterPickupSiteName: textField,
  emitterPickupSiteAddress: textField,
  emitterCustomInfo: textField,

  workerCompanyName: textField,
  workerCompanySiret: stringField,
  workerCompanyAddress: textField,

  transporterCompanyName: textField,
  transporterCompanySiret: stringField,
  transporterCompanyVatNumber: stringField,
  transporterCompanyAddress: textField,
  transporterCustomInfo: textField,
  transporterTransportPlates: stringField,

  destinationCompanyName: textField,
  destinationCompanySiret: stringField,
  destinationCompanyAddress: textField,
  destinationCustomInfo: textField,
  destinationCap: textField,

  brokerCompanyName: textField,
  brokerCompanySiret: stringField,
  brokerCompanyAddress: textField,

  traderCompanyName: textField,
  traderCompanySiret: stringField,
  traderCompanyAddress: textField,

  ecoOrganismeName: textField,
  ecoOrganismeSiret: stringField,

  nextDestinationCompanyName: textField,
  nextDestinationCompanySiret: stringField,
  nextDestinationCompanyVatNumber: stringField,
  nextDestinationCompanyAddress: textField,

  destinationOperationCode: stringField,
  destinationOperationMode: stringField,
  emitterEmissionDate: dateField,

  workerWorkDate: dateField,
  transporterTransportTakenOverAt: dateField,
  destinationReceptionDate: dateField,
  destinationAcceptationDate: dateField,
  destinationAcceptationWeight: numericField,
  destinationOperationDate: dateField,

  isDraftFor: stringField,
  isForActionFor: stringField,
  isFollowFor: stringField,
  isArchivedFor: stringField,
  isToCollectFor: stringField,
  isCollectedFor: stringField,
  sirets: stringField,

  isIncomingWasteFor: stringField,
  isOutgoingWasteFor: stringField,
  isTransportedWasteFor: stringField,
  isManagedWasteFor: stringField,
  isInRevisionFor: stringField,
  isRevisedFor: stringField,

  intermediaries: {
    properties: {
      name: textField,
      siret: stringField,
      address: textField,
      country: textField,
      contact: textField,
      phone: textField,
      mail: textField,
      vatNumber: stringField,
      createdAt: dateField,
      formId: stringField,
      id: stringField
    }
  },

  rawBsd: rawField
};

export type BsdIndexationConfig = {
  alias: string;
  mappings_version: string;
  settings: any;
  mappings: {
    properties: typeof properties;
  };
  elasticSearchUrl: string;
};

export const index: BsdIndexationConfig = {
  // Do not change this alias name unless you know you will break the production when releasing the next version
  alias: process.env.ELASTICSEARCH_BSDS_ALIAS_NAME || "bsds",
  settings,

  // increment when mapping has changed to trigger re-indexation on release
  // only use vX.Y.Z that matches regexp "v\d\.\d\.\d"
  // no special characters that are not supported by ES index names (like ":")
  mappings_version: "v1.1.0",
  mappings: {
    properties
  },
  elasticSearchUrl: process.env.ELASTIC_SEARCH_URL || "http://localhost:9200"
};

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
 * Create/update one document in Elastic Search.
 */
export function indexBsd(bsd: BsdElastic, ctx?: GraphQLContext) {
  logger.info(`Indexing BSD ${bsd.id}`);
  return client.index(
    {
      index: index.alias,
      id: bsd.id,
      body: bsd,
      version_type: "external_gte",
      version: bsd.updatedAt,
      ...refresh(ctx)
    },
    {
      // do not throw version conflict errors
      ignore: [409]
    }
  );
}

export async function getElasticBsdById(id) {
  const result = await client.search({
    index: index.alias,
    body: {
      query: {
        term: {
          readableId: {
            value: id,
            boost: "1.0"
          }
        }
      }
    }
  });
  return result;
}
/**
 * Bulk create/update a list of documents in Elastic Search.
 */
export function indexBsds(
  indexName: string,
  bsds: BsdElastic[],
  elasticSearchUrl: string
) {
  // To allow passing a different `elasticSearchUrl` from the environment of the job queue consumers
  const es = new Client({
    node: elasticSearchUrl,
    ssl: fs.existsSync(certPath)
      ? { ca: fs.readFileSync(certPath, "utf-8") }
      : undefined
  });
  return es.bulk({
    body: bsds.flatMap(bsd => [
      {
        index: {
          _index: indexName,
          _id: bsd.id,
          version_type: "external_gte",
          version: bsd.updatedAt
        }
      },
      bsd
    ]),
    // lighten the response
    _source_excludes: ["items.index._*", "took"]
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
      id,
      ...refresh(ctx)
    },
    { ignore: [404] }
  );
}

/**
 * Group BsdElastic by BSD type
 */
export function groupByBsdType(
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

// This filter is used to exlude "-" from number plates in a pre-processing step
// See https://favro.com/organization/ab14a4f0460a99a9d64d4945/b64d96be58e6a57fe4d5c049?card=tra-9384
export function transportPlateFilter(plate: string) {
  if (!plate) {
    return plate;
  }
  return plate.replace(/-/g, "");
}
