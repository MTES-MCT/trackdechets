import { TotalHits } from "@elastic/elasticsearch/api/types";
import type { WasteRegistryType } from "@td/codegen-back";
import { toWastes, WasteMap } from "./converters";
import { searchBsds, toPrismaBsds } from "./elastic";
import { getElasticPaginationArgs } from "./pagination";
import {
  QueryWastesArgs,
  GenericWaste,
  WasteConnection,
  WasteEdge
} from "./types";
import { prisma } from "@td/prisma";
import { WasteField } from "./columns";

const GIVEN_NAMES_AND_SIRET_FIELDS: [WasteField, WasteField][] = [
  ["emitterCompanyGivenName", "emitterCompanySiret"],
  ["destinationCompanyGivenName", "destinationCompanySiret"],
  ["transporterCompanyGivenName", "transporterCompanySiret"],
  ["transporter2CompanyGivenName", "transporter2CompanySiret"],
  ["transporter3CompanyGivenName", "transporter3CompanySiret"],
  ["transporter4CompanyGivenName", "transporter4CompanySiret"],
  ["transporter5CompanyGivenName", "transporter5CompanySiret"]
];
export async function addCompaniesGivenNames<WasteType extends GenericWaste>(
  wastes: WasteMap<WasteType>
): Promise<WasteMap<WasteType>> {
  // Extract all targeted sirets from wastes
  const sirets: any[] = [];
  Object.keys(wastes).forEach(key => {
    wastes[key].forEach(waste => {
      GIVEN_NAMES_AND_SIRET_FIELDS.forEach(([_, siretField]) => {
        sirets.push(waste[siretField]);
      });
    });
  });

  // Fetch companies once
  const companies = await prisma.company.findMany({
    where: {
      orgId: {
        in: [...new Set(sirets)].filter(Boolean) as string[]
      }
    },
    select: {
      orgId: true,
      givenName: true
    }
  });

  const fixGivenName = (waste, givenNameField, siretField) => {
    if (waste[siretField]) {
      waste[givenNameField] = companies.find(
        company => company.orgId === waste[siretField]
      )?.givenName;
    }
  };

  // Fix wastes, filling given names with value from company
  Object.keys(wastes).forEach(bsdType => {
    wastes[bsdType].forEach(waste => {
      GIVEN_NAMES_AND_SIRET_FIELDS.forEach(([givenNameField, siretField]) => {
        fixGivenName(waste, givenNameField, siretField);
      });
    });
  });

  return wastes;
}

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
  registryType: Exclude<WasteRegistryType, "SSD">,
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

  // For performance reasons, we fetch all companies at once
  // and fill the given names after all the rest has been done
  const wastesWithGivenNames = await addCompaniesGivenNames(wastes);

  const edges = hits.reduce<Array<WasteEdge<WasteType>>>(
    (acc, { _source: bsd }) => {
      if (!bsd) {
        return acc;
      }
      const { type, id, readableId } = bsd;
      const waste = wastesWithGivenNames[type].find(waste =>
        type === "BSDD" ? waste.id === readableId : waste.id === id
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
    totalCount: (searchHits.total as TotalHits).value
  };
}

export default getWasteConnection;
