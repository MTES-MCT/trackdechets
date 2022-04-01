import { ApiResponse } from "@elastic/elasticsearch";
import {
  QueryResolvers,
  Bsd,
  QueryBsdsArgs,
  BsdType,
  OrderType
} from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  client,
  BsdElastic,
  index,
  getKeywordFieldNameFromName,
  getFieldNameFromKeyword,
  GetResponse,
  SearchResponse,
  toPrismaBsds
} from "../../../common/elastic";
import { Bsdasri } from "@prisma/client";
import prisma from "../../../prisma";
import { expandFormFromDb } from "../../../forms/form-converter";
import { unflattenBsdasri } from "../../../bsdasris/converter";
import { expandVhuFormFromDb } from "../../../bsvhu/converter";
import { expandBsdaFromDb } from "../../../bsda/converter";

import { getCachedUserSirets } from "../../../common/redis/users";

import { unflattenBsff } from "../../../bsffs/converter";

async function buildQuery(
  { clue, where = {} }: QueryBsdsArgs,
  user: Express.User
) {
  const query = {
    bool: {
      must: [],
      filter: []
    }
  };

  Object.entries({
    type: where.types,
    isDraftFor: where.isDraftFor,
    isForActionFor: where.isForActionFor,
    isFollowFor: where.isFollowFor,
    isArchivedFor: where.isArchivedFor,
    isToCollectFor: where.isToCollectFor,
    isCollectedFor: where.isCollectedFor
  })
    .filter(([_, value]) => value != null)
    .forEach(([key, value]) => {
      query.bool.filter.push({
        terms: {
          [key]: value
        }
      });
    });

  Object.entries({
    emitterCompanyName: where.emitter,
    destinationCompanyName: where.recipient
  })
    .filter(([_, value]) => value != null)
    .forEach(([key, value]) => {
      query.bool.must.push({
        match: {
          [key]: {
            query: value,
            fuzziness: "AUTO"
          }
        }
      });
    });

  if (where.transporterCustomInfo) {
    query.bool.must.push({
      match: {
        transporterCustomInfo: {
          query: where.transporterCustomInfo,
          fuzziness: 0
        }
      }
    });
  }

  if (where.readableId) {
    query.bool.must.push({
      bool: {
        // behaves like an OR
        should: [
          {
            match: {
              readableId: {
                query: where.readableId,
                // we need `and` operator here because the different components of
                // the readableId (prefix, date and random chars) emit different tokens
                operator: "and"
              }
            }
          },
          { term: { customId: where.readableId } }
        ]
      }
    });
  }

  if (where.transporterNumberPlate) {
    query.bool.must.push({
      match: {
        transporterNumberPlate: {
          query: where.transporterNumberPlate,
          // we need `and` operator here because the different components of
          // the number plate emit different tokens
          operator: "and"
        }
      }
    });
  }

  if (where.waste) {
    query.bool.must.push({
      bool: {
        should: [
          // behaves like an OR
          {
            match: {
              // match on waste code
              "wasteCode.ngram": {
                query: where.waste
              }
            }
          },
          {
            match: {
              wasteDescription: {
                // match on waste description
                query: where.waste,
                fuzziness: "AUTO"
              }
            }
          }
        ]
      }
    });
  }

  if (clue) {
    query.bool.must.push({
      multi_match: {
        query: clue,
        fields: [
          "readableId",
          "emitterCompanyName",
          "destinationCompanyName",
          "wasteDescription"
        ],
        fuzziness: "AUTO"
      }
    });
  }

  // Limit the scope of what the user can see to their companies
  const sirets = await getCachedUserSirets(user.id);
  query.bool.filter.push({
    terms: {
      sirets
    }
  });

  return query;
}

function buildSort({ orderBy = {} }: QueryBsdsArgs) {
  const sort: Array<Record<string, OrderType>> = [
    { createdAt: "DESC" },
    // id is used as last sort to deal with ties
    // (for documents whose sorting result is equal)
    { id: "ASC" }
  ];

  (Object.entries(orderBy) as Array<[keyof typeof orderBy, OrderType]>).forEach(
    ([key, order]) => {
      sort.unshift({ [getKeywordFieldNameFromName(key)]: order });
    }
  );

  return sort;
}

// search_after is an array that contains values from the document to search after
// it must list the values that are used in the sort array
// e.g if sort is [{ emitter: "asc" }, { id: "asc" }]
//     then search_after must be [after.emitter, after.id]
async function buildSearchAfter(
  args: QueryBsdsArgs,
  sort: ReturnType<typeof buildSort>
): Promise<string[] | undefined> {
  if (args.after == null) {
    return undefined;
  }

  const {
    body: { _source: bsd }
  }: ApiResponse<GetResponse<BsdElastic>> = await client.get({
    id: args.after,
    index: index.alias,
    type: index.type
  });

  return sort.reduce(
    (acc, item) =>
      acc.concat(
        Object.entries(item).map(([key]) => bsd[getFieldNameFromKeyword(key)])
      ),
    []
  );
}

/**
 * This function takes an array of dasris and, expand them and add `allowDirectTakeOver` boolean field by
 * requesting emittercompany to know wether direct takeover is allowed
 */
async function buildDasris(dasris: Bsdasri[]) {
  // build a list of emitter siret from dasris, non-INITIAL bsds are ignored
  const emitterSirets = dasris
    .filter(bsd => !!bsd.emitterCompanySiret && bsd.status === "INITIAL")
    .map(bsd => bsd.emitterCompanySiret);

  // deduplicate sirets
  const uniqueSirets = Array.from(new Set(emitterSirets));

  // build an array of sirets allwoing direct takeover
  const allows = (
    await prisma.company.findMany({
      where: {
        siret: { in: uniqueSirets },
        allowBsdasriTakeOverWithoutSignature: true
      },
      select: {
        siret: true
      }
    })
  ).map(comp => comp.siret);

  // expand dasris and insert `allowDirectTakeOver`
  return dasris.map(bsd => ({
    ...unflattenBsdasri(bsd),
    allowDirectTakeOver: allows.includes(bsd.emitterCompanySiret)
  }));
}

const bsdsResolver: QueryResolvers["bsds"] = async (_, args, context) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const MIN_SIZE = 0;
  const MAX_SIZE = 100;
  const { first = MAX_SIZE } = args;
  const size = Math.max(Math.min(first, MAX_SIZE), MIN_SIZE);

  const query = await buildQuery(args, user);
  const sort = buildSort(args);
  const search_after = await buildSearchAfter(args, sort);

  const { body }: ApiResponse<SearchResponse<BsdElastic>> = await client.search(
    {
      index: index.alias,
      body: {
        size:
          size +
          // Take one more result to know if there's a next page
          // it's removed from the actual results though
          1,
        query,
        sort,
        search_after
      }
    }
  );
  const hits = body.hits.hits.slice(0, size);

  const { bsdds, bsdasris, bsvhus, bsdas, bsffs } = await toPrismaBsds(
    hits.map(hit => hit._source)
  );

  const expandedDasris = await buildDasris(bsdasris);

  const bsds: Record<BsdType, Bsd[]> = {
    BSDD: bsdds.map(expandFormFromDb),
    BSDASRI: expandedDasris,
    BSVHU: bsvhus.map(expandVhuFormFromDb),
    BSDA: bsdas.map(expandBsdaFromDb),
    BSFF: bsffs.map(unflattenBsff)
  };
  const edges = hits
    .reduce<Array<Bsd>>((acc, { _source: { type, id } }) => {
      const bsd = bsds[type].find(bsd => bsd.id === id);

      if (bsd) {
        // filter out null values in case Elastic Search
        // is desynchronized with the actual database
        return acc.concat(bsd);
      }

      return acc;
    }, [])
    .map(node => ({
      cursor: node.id,
      node
    }));

  const pageInfo = {
    // startCursor and endCursor are null if the list is empty
    // this is not 100% spec compliant but there are discussions to change that:
    // https://github.com/facebook/relay/issues/1852
    // https://github.com/facebook/relay/pull/2655
    startCursor: edges[0]?.cursor || null,
    endCursor: edges[edges.length - 1]?.cursor || null,

    hasNextPage: body.hits.hits.length > size,
    hasPreviousPage: false
  };

  return {
    edges,
    pageInfo,
    totalCount: body.hits.total
  };
};

export default bsdsResolver;
