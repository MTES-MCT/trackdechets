import { Prisma, BsdasriType } from "@prisma/client";

import { safeInput } from "../forms/form-converter";
import { BsdasriWhere } from "../generated/graphql/types";
import {
  toPrismaDateFilter,
  toPrismaStringFilter,
  toPrismaNestedWhereInput,
  toPrismaGenericWhereInput,
  toPrismaEnumFilter,
  toPrismaStringNullableListFilter
} from "../common/where";

const toPrismaGroupableFilter = (groupable?: boolean) => {
  // groupable dasris should not: group, be grouped, synthesize or be synthesized, and should be SIMPLE

  if (!!groupable) {
    return {
      grouping: { none: {} },
      groupedInId: null,
      synthesizing: { none: {} },
      synthesizedInId: null,
      type: BsdasriType.SIMPLE
    };
  }
  // not groupable dasris should either group, be grouped, synthesize, be synthesized or should not be SIMPLE

  if (groupable === false) {
    return {
      OR: [
        { grouping: { some: {} } },
        { groupedInId: { not: null } },
        { synthesizing: { some: {} } },
        { synthesizedInId: { not: null } },
        { type: { not: BsdasriType.SIMPLE } }
      ]
    };
  }
  return {};
};

const toPrismaSynthesizableFilter = (groupable?: boolean) => {
  // synthesizable dasris should not: group, be grouped, synthesize or be synthesized, and should be SIMPLE

  if (!!groupable) {
    return {
      grouping: { none: {} },
      groupedInId: null,
      synthesizing: { none: {} },
      synthesizedInId: null,
      type: BsdasriType.SIMPLE
    };
  }
  // not groupable dasris should either group, be grouped, synthesize, be synthesized or should not be SIMPLE

  if (groupable === false) {
    return {
      OR: [
        { grouping: { some: {} } },
        { groupedInId: { not: null } },
        { synthesizing: { some: {} } },
        { synthesizedInId: { not: null } },
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
    identificationNumbers: toPrismaStringNullableListFilter(
      where?.identification?.numbers
    ),
    ...toPrismaGroupableFilter(where?.groupable)
  });
}

export function toPrismaWhereInput(
  where: BsdasriWhere
): Prisma.BsdasriWhereInput {
  return toPrismaNestedWhereInput(where, toPrismaBsdasriWhereInput);
}
