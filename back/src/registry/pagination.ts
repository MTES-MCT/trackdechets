import { ApiResponse, estypes } from "@elastic/elasticsearch";
import { BsdElastic, client, index } from "../common/elastic";
import {
  GraphqlPaginationArgs,
  validateGqlPaginationArgs
} from "../common/pagination";
import { OrderType, WasteRegistryType } from "@td/codegen-back";

function buildSort(
  registryType: Exclude<WasteRegistryType, "SSD">,
  order: OrderType
): { [key in keyof BsdElastic]?: OrderType }[] {
  const sortKey: {
    [key in Exclude<WasteRegistryType, "SSD">]: keyof BsdElastic;
  } = {
    OUTGOING: "transporterTransportTakenOverAt",
    INCOMING: "destinationReceptionDate",
    TRANSPORTED: "transporterTransportTakenOverAt",
    MANAGED: "transporterTransportTakenOverAt",
    ALL: "transporterTransportTakenOverAt"
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
  }: ApiResponse<estypes.GetResponse<BsdElastic>> = await client.get({
    id: cursor,
    index: index.alias
  });

  if (!bsd) {
    throw new Error(`Cannot get _source from ES for cursor ${cursor}`);
  }

  return sort.reduce(
    (acc, item) => [
      ...acc,
      ...Object.entries(item).map(([key]) => {
        return typeof bsd[key] === "string"
          ? bsd[key].toLowerCase() // keyword fields have a lowercase normalizer
          : bsd[key];
      })
    ],
    []
  );
}

export async function getElasticPaginationArgs({
  registryType,
  ...args
}: GraphqlPaginationArgs & {
  registryType: Exclude<WasteRegistryType, "SSD">;
}) {
  validateGqlPaginationArgs({
    first: args.first,
    after: args.after,
    last: args.last,
    before: args.before,
    maxPaginateBy: 100
  });

  const size: number = args.first || args.last || 50;
  const order = args.last || args.before ? "DESC" : "ASC";
  const sort = buildSort(registryType, order);
  const cursor = args.before ?? args.after;

  return {
    size,
    sort,
    ...(cursor ? { search_after: await buildSearchAfter(cursor, sort) } : {}),
    isForward: Boolean(args.first || args.after)
  };
}
