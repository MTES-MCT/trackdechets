import { Prisma, BsdasriType } from "@prisma/client";

import { safeInput } from "../forms/form-converter";
import { BsdasriWhere } from "../generated/graphql/types";
import {
  toPrismaDateFilter,
  toPrismaStringFilter,
  toPrismaNestedWhereInput,
  toPrismaGenericWhereInput,
  toPrismaEnumFilter
} from "../common/where";

const toPrismaGroupableFilter = (groupable?: boolean) => {
  // groupable dasris should neither group, nor be grouped and should be SIMPLE

  if (!!groupable) {
    return {
      grouping: { none: {} },
      type: BsdasriType.SIMPLE,
      groupedInId: null
    };
  }
  // not groupable dasris should either group, or be grouped or should not be SIMPLE

  if (groupable === false) {
    return {
      OR: [
        { grouping: { some: {} } },
        { groupedInId: { not: null } },
        { type: { not: BsdasriType.SIMPLE } }
      ]
    };
  }
  return {};
};

function toPrismaBsdasriWhereInput(
  where: BsdasriWhere
): Prisma.BsdasriWhereInput {
  return safeInput<Prisma.BsdasriWhereInput>({
    ...toPrismaGenericWhereInput(where),
    status: toPrismaEnumFilter(where?.status),
    emitterCompanySiret: toPrismaStringFilter(where?.emitter?.company?.siret),
    emitterEmissionSignatureDate: toPrismaDateFilter(
      where?.emitter?.emission?.signature?.date
    ),
    transporterCompanySiret: toPrismaStringFilter(
      where?.transporter?.company?.siret
    ),
    transporterTransportSignatureDate: toPrismaDateFilter(
      where?.transporter?.transport?.signature?.date
    ),

    destinationCompanySiret: toPrismaStringFilter(
      where?.destination?.company?.siret
    ),
    destinationReceptionDate: toPrismaDateFilter(
      where?.destination?.reception?.date
    ),
    destinationOperationCode: toPrismaStringFilter(
      where?.destination?.operation?.code
    ),
    destinationOperationSignatureDate: toPrismaDateFilter(
      where?.destination?.operation?.signature?.date
    ),
    ...toPrismaGroupableFilter(where?.groupable)
  });
}

export function toPrismaWhereInput(
  where: BsdasriWhere
): Prisma.BsdasriWhereInput {
  return toPrismaNestedWhereInput(where, toPrismaBsdasriWhereInput);
}
