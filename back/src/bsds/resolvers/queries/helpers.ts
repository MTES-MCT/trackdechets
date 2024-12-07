import { PrismaBsdMap } from "./types";
import { FormForElastic } from "../../../forms/elastic";
import { BsdasriForElastic } from "../../../bsdasris/elastic";
import { BsvhuForElastic } from "../../../bsvhu/elastic";
import { BsdaForElastic } from "../../../bsda/elastic";
import { BsffForElastic } from "../../../bsffs/elastic";
import { BspaohForElastic } from "../../../bspaoh/elastic";
import { Bsd, BsdType } from "@td/codegen-back";
import { distinct } from "../../../common/arrays";
import { prisma } from "@td/prisma";
import { SearchResponse } from "./types";
import {
  client,
  BsdElastic,
  index,
  groupByBsdType
} from "../../../common/elastic";

import { expandFormFromElastic } from "../../../forms/converter";

import { expandVhuFormFromDb } from "../../../bsvhu/converter";
import { expandBsdaFromElastic } from "../../../bsda/converter";
import { expandBsffFromElastic } from "../../../bsffs/converter";
import { expandBspaohFromElastic } from "../../../bspaoh/converter";

import { ApiResponse } from "@elastic/elasticsearch";
/**
 * Convert a list of BsdElastic to a mapping of prisma-like Bsds by retrieving rawBsd elastic field
 */
export async function toRawBsds(
  bsdsElastic: BsdElastic[]
): Promise<PrismaBsdMap> {
  const { BSDD, BSDA, BSDASRI, BSFF, BSVHU, BSPAOH } =
    groupByBsdType(bsdsElastic);

  return {
    bsdds: BSDD.map(bsdElastic => bsdElastic.rawBsd as FormForElastic),
    bsdasris: BSDASRI.map(
      bsdsElastic => bsdsElastic.rawBsd as BsdasriForElastic
    ),
    bsvhus: BSVHU.map(bsdElastic => bsdElastic.rawBsd as BsvhuForElastic),
    bsdas: BSDA.map(bsdElastic => bsdElastic.rawBsd as BsdaForElastic),
    bsffs: BSFF.map(bsdsElastic => bsdsElastic.rawBsd as BsffForElastic),
    bspaohs: BSPAOH.map(bsdsElastic => bsdsElastic.rawBsd as BspaohForElastic)
  };
}
import { expandBsdasriFromElastic } from "../../../bsdasris/converter";

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
 * This function takes an array of dasris and, expand them and add `allowDirectTakeOver` boolean field by
 * requesting emittercompany to know wether direct takeover is allowed
 */
export async function buildDasris(dasris: BsdasriForElastic[]) {
  // build a list of emitter siret from dasris, non-INITIAL bsds are ignored
  const emitterSirets = dasris
    .filter(bsd => !!bsd.emitterCompanySiret && bsd.status === "INITIAL")
    .map(bsd => bsd.emitterCompanySiret)
    .filter(Boolean);

  const uniqueSirets = distinct(emitterSirets);

  // build an array of sirets allowing direct takeover
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
    ...expandBsdasriFromElastic(bsd),
    allowDirectTakeOver: allows.includes(bsd.emitterCompanySiret)
  }));
}

export const buildResponse = async ({ query, size, sort, search_after }) => {
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

  const {
    bsdds: concreteBsdds,
    bsdasris: concreteBsdasris,
    bsvhus: concreteBsvhus,
    bsdas: concreteBsdas,
    bsffs: concreteBsffs,
    bspaohs: concreteBspaohs
  } = await toRawBsds(hits.map(hit => hit._source));

  const bsds: Record<BsdType, Bsd[]> = {
    BSDD: concreteBsdds.map(expandFormFromElastic),
    BSDASRI: await buildDasris(concreteBsdasris),
    BSVHU: concreteBsvhus.map(expandVhuFormFromDb),
    BSDA: concreteBsdas.map(expandBsdaFromElastic),
    BSFF: concreteBsffs.map(expandBsffFromElastic),
    BSPAOH: concreteBspaohs.map(expandBspaohFromElastic)
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
    totalCount: body.hits.total.value
  };
};
