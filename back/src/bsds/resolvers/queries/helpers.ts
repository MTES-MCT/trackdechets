import { PrismaBsdMap } from "./types";
import { FormForElastic } from "../../../forms/elastic";
import { BsdasriForElastic } from "../../../bsdasris/elastic";
import { BsvhuForElastic } from "../../../bsvhu/elastic";
import { BsdaForElastic } from "../../../bsda/elastic";
import { BsffForElastic } from "../../../bsffs/elastic";
import { BspaohForElastic } from "../../../bspaoh/elastic";
import type { Bsd, BsdType } from "@td/codegen-back";
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
import { expandBsdasriFromElastic } from "../../../bsdasris/converter";

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

/**
 * Returns the keyword field matching the given fieldName.
 */
export function getKeywordFieldNameFromName(
  fieldName: keyof BsdElastic
): string {
  const property = index.mappings.properties[fieldName];

  if (property.type === "keyword") {
    return fieldName;
  }

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
  const emitterSirets = dasris
    .filter(bsd => !!bsd.emitterCompanySiret && bsd.status === "INITIAL")
    .map(bsd => bsd.emitterCompanySiret)
    .filter(Boolean);

  const uniqueSirets = distinct(emitterSirets);

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
        size: size + 1, // Take one more result to know if there's a next page
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

  // -------------------------------------------------------------------------
  // Récupération des gerepId des émetteurs via Prisma
  // -------------------------------------------------------------------------
  const emitterSirets = distinct(
    [
      ...concreteBsdds.map(b => b.emitterCompanySiret),
      ...concreteBsdasris.map(b => b.emitterCompanySiret),
      ...concreteBsdas.map(b => b.emitterCompanySiret),
      ...concreteBsffs.map(b => b.emitterCompanySiret),
      ...concreteBsvhus.map(b => b.emitterCompanySiret),
      ...concreteBspaohs.map(b => b.emitterCompanySiret)
    ].filter(Boolean)
  ) as string[];

  const companies = await prisma.company.findMany({
    where: { siret: { in: emitterSirets } },
    select: { siret: true, gerepId: true }
  });

  const gerepIdBySiret = Object.fromEntries(
    companies.map(c => [c.siret, c.gerepId])
  );
  // -------------------------------------------------------------------------

  const bsds: Record<BsdType, Bsd[]> = {
    BSDD: concreteBsdds.map(expandFormFromElastic),
    BSDASRI: await buildDasris(concreteBsdasris),
    BSVHU: concreteBsvhus.map(expandVhuFormFromDb),
    BSDA: concreteBsdas.map(expandBsdaFromElastic),
    BSFF: concreteBsffs.map(expandBsffFromElastic),
    BSPAOH: concreteBspaohs.map(expandBspaohFromElastic)
  };

  const edges = hits.reduce<Array<{ cursor: string; node: Bsd }>>(
    (acc, hit: any) => {
      const { type, id } = hit._source;
      const bsd = bsds[type].find(b => b.id === id);

      if (bsd) {
        const cursorValue =
          hit.sort && hit.sort.length > 0 ? String(hit.sort[0]) : hit._id;

        // Ton ajout ici 👇
        const emitterSiret = hit._source.emitterCompanySiret;

        return acc.concat({
          cursor: cursorValue,
          node: {
            ...bsd,
            emitter: {
              ...bsd.emitter,
              company: {
                ...bsd.emitter?.company,
                gerepId: gerepIdBySiret[emitterSiret] ?? null
              }
            }
          }
        });
      }

      return acc;
    },
    []
  );

  const pageInfo = {
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
