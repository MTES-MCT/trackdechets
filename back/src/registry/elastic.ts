import {
  QueryDslQueryContainer,
  SearchHitsMetadata
} from "@elastic/elasticsearch/api/types";
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
  where: WasteRegistryWhere
): QueryDslQueryContainer {
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
  where: WasteRegistryWhere,
  { size, sort, search_after }: ElasticPaginationArgs
): Promise<SearchHitsMetadata<BsdElastic>> {
  const query = buildQuery(registryType, sirets, where);

  const { body } = await client.search({
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
  });

  return body.hits;
}
