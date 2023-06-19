import { tov1ReadableId } from "../forms/compat";
import { WasteRegistryType } from "../generated/graphql/types";
import { toWastes } from "./converters";
import { searchBsds, toPrismaBsds } from "./elastic";
import { getElasticPaginationArgs } from "./pagination";
import {
  QueryWastesArgs,
  GenericWaste,
  WasteConnection,
  WasteEdge
} from "./types";

/**
 * Perform the actual data fetching and return a waste connection
 */

/**
 * Perform the actual data fetching and return a waste connection
 * @param registryType type de registre : entrant, sortant, transport, etc
 * @param args (first, after, last, before, sirets, where)
 * @param converter Map BSDs to WasteType where WasteType can be
 * IncomingWaste, OutgoingWaste, TransportedWaste, etc
 * @returns
 */
async function getWasteConnection<WasteType extends GenericWaste>(
  registryType: WasteRegistryType,
  args: QueryWastesArgs
): Promise<WasteConnection<WasteType>> {
  const { size, sort, search_after, isForward } =
    await getElasticPaginationArgs({
      registryType,
      first: args.first,
      after: args.after,
      last: args.last,
      before: args.before
    });

  const searchHits = await searchBsds(
    registryType,
    args.sirets,
    args.where ?? {},
    {
      size,
      sort,
      ...(search_after ? { search_after } : {})
    }
  );

  const hits = searchHits.hits.slice(0, size);

  const bsds = await toPrismaBsds(
    searchHits.hits.map(hit => hit._source).filter(Boolean)
  );

  const wastes = toWastes<WasteType>(registryType, bsds);

  const edges = hits.reduce<Array<WasteEdge<WasteType>>>(
    (acc, { _source: bsd }) => {
      if (!bsd) {
        return acc;
      }
      const { type, id, readableId } = bsd;
      const waste = wastes[type].find(waste =>
        type === "BSDD"
          ? waste.id === tov1ReadableId(readableId)
          : waste.id === id
      );

      if (waste) {
        // filter out null values in case Elastic Search
        // is desynchronized with the actual database
        return acc.concat({ cursor: id, node: waste });
      }

      return acc;
    },
    []
  );

  if (!isForward) {
    edges.reverse();
  }

  const pageInfo = {
    // startCursor and endCursor are null if the list is empty
    // this is not 100% spec compliant but there are discussions to change that:
    // https://github.com/facebook/relay/issues/1852
    // https://github.com/facebook/relay/pull/2655
    startCursor: edges[0]?.cursor || null,
    endCursor: edges[edges.length - 1]?.cursor || null,
    // FIXME need an extra call to retrieve hasNextPage when paginating backward
    hasNextPage: isForward ? searchHits.hits.length > size : false,
    // FIXME need an extra call to retrieve hasPreviousPage when paginating forward
    hasPreviousPage: !isForward ? searchHits.hits.length > size : false
  };

  return {
    edges,
    pageInfo,
    totalCount: searchHits.total as number
  };
}

export default getWasteConnection;
