import fs from "fs";
import path from "path";
import { Client, RequestParams } from "@elastic/elasticsearch";
import { GraphQLContext } from "../types";
import { AuthType } from "../auth";
import prisma from "../prisma";
import { Bsda, Bsdasri, Bsff, Bsvhu, Form, Prisma } from "@prisma/client";
import logger from "../logging/logger";
import { BsdType, FormCompany } from "../generated/graphql/types";

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

  emitterEmissionDate: number;
  workerWorkDate: number;
  transporterTransportTakenOverAt: number;
  destinationReceptionDate: number;
  destinationAcceptationDate: number;
  destinationAcceptationWeight: number;
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

  intermediaries?: FormCompany[];

  rawBsd: any;
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
        tokenize_on_chars: ["whitespace", "-"]
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

export type BsdIndex = {
  alias: string;
  type: string;
  mappings_version: string;
  settings: any;
  mappings: {
    properties: typeof properties;
  };
};

export const index: BsdIndex = {
  // Do not change this alias name unless you know you will break the production when releasing the next version
  alias: process.env.ELASTICSEARCH_BSDS_ALIAS_NAME || "bsds",
  // The next major version of Elastic Search doesn't use "type" anymore
  // so while it's required for the current version, we are not using it too much
  type: "_doc",
  settings,

  // increment when mapping has changed to trigger re-indexation on release
  // only use vX.Y.Z that matches regexp "v\d\.\d\.\d"
  // no special characters that are not supported by ES index names (like ":")
  mappings_version: "v1.0.0",
  mappings: {
    properties
  }
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
 * Create/update a document in Elastic Search.
 */
export function indexBsd(bsd: BsdElastic, ctx?: GraphQLContext) {
  logger.info(`Indexing BSD ${bsd.id}`);
  return client.index(
    {
      index: index.alias,
      type: index.type,
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

/**
 * Bulk create/update a list of documents in Elastic Search.
 */
export function indexBsds(indexName: string, bsds: BsdElastic[]) {
  return client.bulk({
    body: bsds.flatMap(bsd => [
      {
        index: {
          _index: indexName,
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
export function deleteBsd<T extends { id?: string }>(
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
 * Convert a list of BsdElastic to a mapping of prisma Bsds - Used for registry
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
