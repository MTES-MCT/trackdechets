import { estypes } from "@elastic/elasticsearch";
import { BsdElastic, client, index } from "../common/elastic";
import {
  OrderType,
  WasteRegistryType,
  WasteRegistryWhere
} from "../generated/graphql/types";
import { toElasticFilter } from "./where";

export function buildQuery(
  registryType: WasteRegistryType,
  sirets: string[],
  where: WasteRegistryWhere | undefined | null
): estypes.QueryDslQueryContainer {
  const elasticKey: { [key in WasteRegistryType]: keyof BsdElastic } = {
    OUTGOING: "isOutgoingWasteFor",
    INCOMING: "isIncomingWasteFor",
    TRANSPORTED: "isTransportedWasteFor",
    MANAGED: "isManagedWasteFor",
    ALL: "sirets"
  };

  return {
    bool: {
      filter: [
        {
          terms: {
            [elasticKey[registryType]]: sirets
          }
        },
        ...(where ? toElasticFilter(where) : [])
      ]
    }
  };
}

type ElasticPaginationArgs = {
  size: number;
  sort: { [key in keyof BsdElastic]?: OrderType }[];
  search_after?: (string | number)[];
};

export async function searchBsds(
  registryType: WasteRegistryType,
  sirets: string[],
  where: WasteRegistryWhere | undefined | null,
  { size, sort, search_after }: ElasticPaginationArgs
): Promise<estypes.SearchHitsMetadata<BsdElastic>> {
  const sortKey = Object.keys(sort[0])[0];
  const query = buildQuery(registryType, sirets, where);

  const { body } = await client.search({
    index: index.alias,
    body: {
      size:
        size +
        // Take one more result to know if there's a next page
        // it's removed from the actual results though
        1,
      query: {
        bool: {
          ...query.bool,
          // make sure ordering is consistent by filtering out possible null value on sort key
          must: {
            exists: { field: sortKey }
          }
        }
      },
      sort,
      search_after
    }
  });

  return body.hits;
}
