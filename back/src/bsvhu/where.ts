import { Prisma } from "@prisma/client";
import { safeInput } from "../forms/form-converter";
import { BsvhuWhere } from "../generated/graphql/types";
import {
  toPrismaDateFilter,
  toPrismaStringFilter,
  toPrismaNestedWhereInput,
  toPrismaGenericWhereInput,
  toPrismaEnumFilter
} from "../common/where";

function toPrismaBsvhuWhereInput(where: BsvhuWhere): Prisma.BsvhuWhereInput {
  return safeInput<Prisma.BsvhuWhereInput>({
    ...toPrismaGenericWhereInput(where),
    status: toPrismaEnumFilter(where.status),
    emitterCompanySiret: toPrismaStringFilter(where.emitter?.company?.siret),
    emitterEmissionSignatureDate: toPrismaDateFilter(
      where.emitter?.emission?.signature?.date
    ),
    transporterCompanySiret: toPrismaStringFilter(
      where.transporter?.company?.siret
    ),
    transporterTransportSignatureDate: toPrismaDateFilter(
      where.transporter?.transport?.signature?.date
    ),
    destinationCompanySiret: toPrismaStringFilter(
      where.destination?.company?.siret
    ),
    destinationReceptionDate: toPrismaDateFilter(
      where.destination?.reception?.date
    ),
    destinationOperationCode: toPrismaStringFilter(
      where.destination?.operation?.code
    ),
    destinationOperationSignatureDate: toPrismaDateFilter(
      where.destination?.operation?.signature?.date
    )
  });
}

export function toPrismaWhereInput(where: BsvhuWhere): Prisma.BsvhuWhereInput {
  return toPrismaNestedWhereInput(where, toPrismaBsvhuWhereInput);
}
