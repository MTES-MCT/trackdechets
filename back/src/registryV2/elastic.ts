import { prisma } from "@td/prisma";
import { estypes } from "@elastic/elasticsearch";
import { DateFilter } from "@td/codegen-back";
import {
  RegistryV2Bsdd,
  RegistryV2Bsdasri,
  RegistryV2Bsvhu,
  RegistryV2Bsda,
  RegistryV2Bsff,
  RegistryV2Bspaoh,
  RegistryV2BsdaInclude,
  RegistryV2BsdasriInclude,
  RegistryV2BsddInclude,
  RegistryV2BsffInclude,
  RegistryV2BspaohInclude,
  RegistryV2BsvhuInclude
} from "./types";
import { BsdElastic, groupByBsdType } from "../common/elastic";
import { toElasticDateQuery } from "../common/where";

export type RegistryV2BsdMap = {
  BSDD: RegistryV2Bsdd[];
  BSDASRI: RegistryV2Bsdasri[];
  BSVHU: RegistryV2Bsvhu[];
  BSDA: RegistryV2Bsda[];
  BSFF: RegistryV2Bsff[];
  BSPAOH: RegistryV2Bspaoh[];
};
/**
 * Convert a list of BsdElastic to a mapping of prisma Bsds
 */
export async function toPrismaBsds(
  bsdsElastic: BsdElastic[]
): Promise<RegistryV2BsdMap> {
  const { BSDD, BSDASRI, BSVHU, BSDA, BSFF, BSPAOH } =
    groupByBsdType(bsdsElastic);

  const prismaBsdsPromises: [
    Promise<RegistryV2Bsdd[]>,
    Promise<RegistryV2Bsdasri[]>,
    Promise<RegistryV2Bsvhu[]>,
    Promise<RegistryV2Bsda[]>,
    Promise<RegistryV2Bsff[]>,
    Promise<RegistryV2Bspaoh[]>
  ] = [
    BSDD.length > 0
      ? prisma.form.findMany({
          where: {
            id: {
              in: BSDD.map(bsdd => bsdd.id)
            }
          },
          include: RegistryV2BsddInclude
        })
      : Promise.resolve([]),
    BSDASRI.length > 0
      ? prisma.bsdasri.findMany({
          where: { id: { in: BSDASRI.map(bsdasri => bsdasri.id) } },
          include: RegistryV2BsdasriInclude
        })
      : Promise.resolve([]),
    BSVHU.length > 0
      ? prisma.bsvhu.findMany({
          where: {
            id: {
              in: BSVHU.map(bsvhu => bsvhu.id)
            }
          },
          include: RegistryV2BsvhuInclude
        })
      : Promise.resolve([]),
    BSDA.length > 0
      ? prisma.bsda.findMany({
          where: {
            id: {
              in: BSDA.map(bsda => bsda.id)
            }
          },
          include: RegistryV2BsdaInclude
        })
      : Promise.resolve([]),
    BSFF.length > 0
      ? prisma.bsff.findMany({
          where: {
            id: {
              in: BSFF.map(bsff => bsff.id)
            }
          },
          include: RegistryV2BsffInclude
        })
      : Promise.resolve([]),
    BSPAOH.length > 0
      ? prisma.bspaoh.findMany({
          where: {
            id: {
              in: BSPAOH.map(bspaoh => bspaoh.id)
            }
          },
          include: RegistryV2BspaohInclude
        })
      : Promise.resolve([])
  ];

  const [bsdds, bsdasris, bsvhus, bsdas, bsffs, bspaohs] = await Promise.all(
    prismaBsdsPromises
  );
  return {
    BSDD: bsdds,
    BSDASRI: bsdasris,
    BSVHU: bsvhus,
    BSDA: bsdas,
    BSFF: bsffs,
    BSPAOH: bspaohs
  };
}

export function dateFilterToElasticFilter(
  fieldName: keyof BsdElastic,
  dateFilter: DateFilter
): estypes.QueryContainer {
  return toElasticDateQuery(fieldName, dateFilter, false) ?? {};
}
