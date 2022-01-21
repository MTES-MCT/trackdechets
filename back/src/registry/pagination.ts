import { ApiResponse } from "@elastic/elasticsearch";
import { GetResponse } from "@elastic/elasticsearch/api/types";
import { elasticSearchClient as client } from "@trackdechets/common";
import { BsdElastic, index } from "../common/elastic";
import {
  GraphqlPaginationArgs,
  validateGqlPaginationArgs
} from "../common/pagination";
import { OrderType, WasteRegistryType } from "../generated/graphql/types";

function buildSort(
  registryType: WasteRegistryType,
  order: OrderType
): { [key in keyof BsdElastic]?: OrderType }[] {
  const sortKey: { [key in WasteRegistryType]: keyof BsdElastic } = {
    OUTGOING: "transporterTakenOverAt",
    INCOMING: "destinationReceptionDate",
    TRANSPORTED: "transporterTakenOverAt",
    MANAGED: "transporterTakenOverAt",
    ALL: "transporterTakenOverAt"
  };

  return [
    { [sortKey[registryType]]: order },
    // id is used as last sort to deal with ties
    // (for documents whose sorting result is equal)
    { id: order }
  ];
}

// search_after is an array that contains values from the document to search after
// it must list the values that are used in the sort array
// e.g if sort is [{ destinationReceptionDate: "asc" }, { id: "asc" }]
//     then search_after must be [after.destinationReceptionDate, after.id]
async function buildSearchAfter(
  cursor: string,
  sort: ReturnType<typeof buildSort>
): Promise<(string | number)[]> {
  const {
    body: { _source: bsd }
  }: ApiResponse<GetResponse<BsdElastic>> = await client.get({
    id: cursor,
    index: index.alias,
    type: index.type
  });

  return sort.reduce(
    (acc, item) => [...acc, ...Object.entries(item).map(([key]) => bsd[key])],
    []
  );
}

export async function getElasticPaginationArgs({
  registryType,
  ...args
}: GraphqlPaginationArgs & { registryType: WasteRegistryType }) {
  validateGqlPaginationArgs({
    first: args.first,
    after: args.after,
    last: args.last,
    before: args.before,
    maxPaginateBy: 100
  });

  let first = args.first;
  let last = args.last;

  if (!first && !last) {
    if (args.before) {
      last = 50;
    } else {
      first = 50;
    }
  }

  const order = last ? "DESC" : "ASC";
  const sort = buildSort(registryType, order);
  const cursor = args.before ?? args.after;

  return {
    size: first ?? last,
    sort,
    ...(cursor ? { search_after: await buildSearchAfter(cursor, sort) } : {}),
    isForward: !!first
  };
}
