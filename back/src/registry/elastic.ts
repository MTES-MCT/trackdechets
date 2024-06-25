import { estypes } from "@elastic/elasticsearch";
import { BsdElastic, client, groupByBsdType, index } from "../common/elastic";
import {
  OrderType,
  WasteRegistryType,
  WasteRegistryWhere
} from "../generated/graphql/types";
import { toElasticFilter } from "./where";
import { Bsvhu, Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";

export function buildQuery(
  registryType: WasteRegistryType,
  sirets: string[],
  where: WasteRegistryWhere | undefined | null
): estypes.QueryContainer {
  // Associe un type de registre au champ ES permettant de stocker
  // la liste des établissements concerné par ce type de registre sur un
  // BSD donnée
  const elasticKey: { [key in WasteRegistryType]?: keyof BsdElastic } = {
    OUTGOING: "isOutgoingWasteFor",
    INCOMING: "isIncomingWasteFor",
    TRANSPORTED: "isTransportedWasteFor",
    MANAGED: "isManagedWasteFor",
    ALL: "isAllWasteFor"
  };

  // Fonction permettant de construire le filtre ES pour un type de registre donné.
  function registryTypeFilter(type: WasteRegistryType): estypes.QueryContainer {
    return { terms: { [elasticKey[type]!]: sirets } };
  }

  return {
    bool: {
      filter: [
        registryTypeFilter(registryType),
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
): Promise<estypes.HitsMetadata<BsdElastic>> {
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

export const RegistryFormInclude = Prisma.validator<Prisma.FormInclude>()({
  forwarding: { include: { transporters: true } },
  forwardedIn: { include: { transporters: true } },
  finalOperations: true,
  grouping: { include: { initialForm: { include: { transporters: true } } } },
  transporters: true
});

export type RegistryForm = Prisma.FormGetPayload<{
  include: typeof RegistryFormInclude;
}>;

export const RegistryBsdaInclude = Prisma.validator<Prisma.BsdaInclude>()({
  grouping: true,
  forwarding: true,
  forwardedIn: true,
  transporters: true,
  finalOperations: true
});

export type RegistryBsda = Prisma.BsdaGetPayload<{
  include: typeof RegistryBsdaInclude;
}>;

export const RegistryBsdasriInclude = { grouping: true, finalOperations: true };

export type RegistryBsdasri = Prisma.BsdasriGetPayload<{
  include: typeof RegistryBsdasriInclude;
}>;

export const RegistryBspaohInclude = Prisma.validator<Prisma.BspaohInclude>()({
  transporters: true
});

export type RegistryBspaoh = Prisma.BspaohGetPayload<{
  include: typeof RegistryBspaohInclude;
}>;

export const RegistryBsffInclude = Prisma.validator<Prisma.BsffInclude>()({
  transporters: true,
  packagings: {
    include: {
      finalOperations: true,
      previousPackagings: {
        include: { bsff: true }
      }
    }
  }
});

export type RegistryBsff = Prisma.BsffGetPayload<{
  include: typeof RegistryBsffInclude;
}>;

type RegistryBsvhu = Bsvhu;

export type RegistryBsdMap = {
  bsdds: RegistryForm[];
  bsdasris: RegistryBsdasri[];
  bsvhus: RegistryBsvhu[];
  bsdas: RegistryBsda[];
  bsffs: RegistryBsff[];
  bspaohs: RegistryBspaoh[];
};
/**
 * Convert a list of BsdElastic to a mapping of prisma Bsds
 */
export async function toPrismaBsds(
  bsdsElastic: BsdElastic[]
): Promise<RegistryBsdMap> {
  const { BSDD, BSDASRI, BSVHU, BSDA, BSFF, BSPAOH } =
    groupByBsdType(bsdsElastic);

  const prismaBsdsPromises: [
    Promise<RegistryForm[]>,
    Promise<RegistryBsdasri[]>,
    Promise<RegistryBsvhu[]>,
    Promise<RegistryBsda[]>,
    Promise<RegistryBsff[]>,
    Promise<RegistryBspaoh[]>
  ] = [
    prisma.form.findMany({
      where: {
        id: {
          in: BSDD.map(bsdd => bsdd.id)
        }
      },
      include: RegistryFormInclude
    }),
    prisma.bsdasri.findMany({
      where: { id: { in: BSDASRI.map(bsdasri => bsdasri.id) } },
      include: RegistryBsdasriInclude
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
      include: RegistryBsdaInclude
    }),
    prisma.bsff.findMany({
      where: {
        id: {
          in: BSFF.map(bsff => bsff.id)
        }
      },
      include: RegistryBsffInclude
    }),
    prisma.bspaoh.findMany({
      where: {
        id: {
          in: BSPAOH.map(bspaoh => bspaoh.id)
        }
      },
      include: RegistryBspaohInclude
    })
  ];

  const [bsdds, bsdasris, bsvhus, bsdas, bsffs, bspaohs] = await Promise.all(
    prismaBsdsPromises
  );
  return { bsdds, bsdasris, bsvhus, bsdas, bsffs, bspaohs };
}
