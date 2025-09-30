import { Prisma } from "@td/prisma";
import { safeInput } from "../common/converter";
import type { BsvhuWhere } from "@td/codegen-back";
import {
  toPrismaDateFilter,
  toPrismaStringFilter,
  toPrismaNestedWhereInput,
  toPrismaGenericWhereInput,
  toPrismaEnumFilter,
  toPrismaStringNullableListFilter
} from "../common/where";

function toPrismaBsvhuWhereInput(where: BsvhuWhere): Prisma.BsvhuWhereInput {
  return safeInput<Prisma.BsvhuWhereInput>({
    ...toPrismaGenericWhereInput(where),
    status: toPrismaEnumFilter(where.status),
    customId: toPrismaStringFilter(where.customId),
    emitterCompanySiret: toPrismaStringFilter(where.emitter?.company?.siret),
    emitterEmissionSignatureDate: toPrismaDateFilter(
      where.emitter?.emission?.signature?.date
    ),
    ...(where.transporter
      ? {
          transporters: {
            some: {
              transporterCompanySiret: toPrismaStringFilter(
                where.transporter?.company?.siret
              ),
              transporterCompanyVatNumber: toPrismaStringFilter(
                where.transporter?.company?.vatNumber
              ),
              transporterTransportSignatureDate: toPrismaDateFilter(
                where.transporter?.transport?.signature?.date
              ),
              transporterTransportPlates: toPrismaStringNullableListFilter(
                where.transporter?.transport?.plates
              )
            }
          }
        }
      : {}),
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
    brokerCompanySiret: toPrismaStringFilter(where.broker?.company?.siret),
    traderCompanySiret: toPrismaStringFilter(where.trader?.company?.siret)
  });
}

export function toPrismaWhereInput(where: BsvhuWhere): Prisma.BsvhuWhereInput {
  return toPrismaNestedWhereInput(where, toPrismaBsvhuWhereInput);
}
