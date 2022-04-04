import { Prisma } from "@prisma/client";
import { safeInput } from "../forms/form-converter";
import { BsdaWhere } from "@trackdechets/codegen/src/back.gen";
import {
  toPrismaDateFilter,
  toPrismaStringFilter,
  toPrismaNestedWhereInput,
  toPrismaGenericWhereInput,
  toPrismaEnumFilter,
  toPrismaIdFilter,
  toPrismaRelationIdFilter
} from "../common/where";

function toPrismaBsdaWhereInput(where: BsdaWhere): Prisma.BsdaWhereInput {
  return safeInput<Prisma.BsdaWhereInput>({
    ...toPrismaGenericWhereInput(where),
    status: toPrismaEnumFilter(where.status),
    emitterCompanySiret: toPrismaStringFilter(where.emitter?.company?.siret),
    emitterEmissionSignatureDate: toPrismaDateFilter(
      where.emitter?.emission?.signature?.date
    ),
    emitterCustomInfo: toPrismaStringFilter(where.emitter?.customInfo),
    transporterCompanySiret: toPrismaStringFilter(
      where.transporter?.company?.siret
    ),
    transporterTransportSignatureDate: toPrismaDateFilter(
      where.transporter?.transport?.signature?.date
    ),
    transporterCustomInfo: toPrismaStringFilter(where.transporter?.customInfo),
    workerCompanySiret: toPrismaStringFilter(where.worker?.company?.siret),
    workerWorkSignatureDate: toPrismaDateFilter(
      where.worker?.work?.signature?.date
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
    ),
    destinationCustomInfo: toPrismaStringFilter(where.destination?.customInfo),
    brokerCompanySiret: toPrismaStringFilter(where.broker?.company?.siret),
    groupedInId: toPrismaIdFilter(where.groupedIn),
    forwardedIn: toPrismaRelationIdFilter(where.forwardedIn) as Prisma.XOR<
      Prisma.BsdaRelationFilter,
      Prisma.BsdaWhereInput
    >
  });
}

export function toPrismaWhereInput(where: BsdaWhere): Prisma.BsdaWhereInput {
  return toPrismaNestedWhereInput(where, toPrismaBsdaWhereInput);
}
