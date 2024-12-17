import { Prisma, BsdasriType } from "@prisma/client";
import { safeInput } from "../common/converter";
import type { BsdasriWhere } from "@td/codegen-back";
import {
  toPrismaDateFilter,
  toPrismaStringFilter,
  toPrismaNestedWhereInput,
  toPrismaGenericWhereInput,
  toPrismaEnumFilter,
  toPrismaStringNullableListFilter
} from "../common/where";

const toPrismaGroupableFilter = (groupable?: boolean | null) => {
  // groupable dasris should not: group, be grouped, synthesize or be synthesized, and should be SIMPLE

  if (!!groupable) {
    return {
      groupingEmitterSirets: { isEmpty: true },
      groupedInId: null,
      synthesisEmitterSirets: { isEmpty: true },
      synthesizedInId: null,
      type: BsdasriType.SIMPLE
    };
  }

  // not groupable dasris should either group, be grouped, synthesize, be synthesized or should not be SIMPLE
  if (groupable === false) {
    return {
      OR: [
        { groupingEmitterSirets: { isEmpty: false } },
        { groupedInId: { not: null } },
        { synthesisEmitterSirets: { isEmpty: false } },
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
    type: toPrismaEnumFilter(where?.type),
    emitterCompanySiret: toPrismaStringFilter(where?.emitter?.company?.siret),
    emitterEmissionSignatureDate: toPrismaDateFilter(
      where?.emitter?.emission?.signature?.date
    ),
    transporterCompanySiret: toPrismaStringFilter(
      where?.transporter?.company?.siret
    ),
    transporterCompanyVatNumber: toPrismaStringFilter(
      where?.transporter?.company?.vatNumber
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
