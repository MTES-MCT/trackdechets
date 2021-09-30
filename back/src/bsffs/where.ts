import { BsffWhere, BsffOperationCode } from "../generated/graphql/types";
import { Prisma } from "@prisma/client";
import { safeInput } from "../forms/form-converter";
import {
  toPrismaDateFilter,
  toPrismaEnumFilter,
  toPrismaStringFilter,
  toPrismaNestedWhereInput,
  toPrismaGenericWhereInput
} from "../common/where";

function toPrismaBsffWhereInput(where: BsffWhere): Prisma.BsffWhereInput {
  return safeInput<Prisma.BsffWhereInput>({
    ...toPrismaGenericWhereInput(where),
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
    destinationReceptionSignatureDate: toPrismaDateFilter(
      where.destination?.reception?.signature.date
    ),
    destinationOperationCode: toPrismaEnumFilter<BsffOperationCode>(
      where.destination?.operation?.code
    ),
    destinationOperationSignatureDate: toPrismaDateFilter(
      where.destination?.operation?.signature?.date
    )
  });
}
export function toPrismaWhereInput(where: BsffWhere): Prisma.BsffWhereInput {
  return toPrismaNestedWhereInput(where, toPrismaBsffWhereInput);
}
