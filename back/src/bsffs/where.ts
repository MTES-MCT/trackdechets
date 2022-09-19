import { BsffWhere, BsffPackagingWhere } from "../generated/graphql/types";
import { Prisma } from "@prisma/client";
import { safeInput } from "../common/converter";
import {
  toPrismaDateFilter,
  toPrismaEnumFilter,
  toPrismaStringFilter,
  toPrismaNestedWhereInput,
  toPrismaGenericWhereInput
} from "../common/where";

function toPrismaBsffSimpleWhereInput(where: BsffWhere): Prisma.BsffWhereInput {
  return safeInput<Prisma.BsffWhereInput>({
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
    ...(where?.packagings?.numero
      ? {
          packagings: {
            some: { numero: toPrismaStringFilter(where.packagings.numero) }
          }
        }
      : {})
  });
}
export function toPrismaBsffWhereInput(
  where: BsffWhere
): Prisma.BsffWhereInput {
  return toPrismaNestedWhereInput(where, toPrismaBsffSimpleWhereInput);
}

export function toPrismaBsffPackagingSimpleWhereInput(
  where: BsffPackagingWhere
): Prisma.BsffPackagingWhereInput {
  return safeInput<Prisma.BsffPackagingWhereInput>({
    numero: toPrismaStringFilter(where.numero),
    acceptationSignatureDate: toPrismaDateFilter(
      where.acceptation?.signature?.date
    ),
    acceptationWasteCode: toPrismaStringFilter(where.acceptation?.wasteCode),
    operationCode: toPrismaEnumFilter(where.operation?.code),
    operationSignatureDate: toPrismaDateFilter(
      where.operation?.signature?.date
    ),
    bsff: toPrismaBsffWhereInput(where.bsff)
  });
}

export function toPrismaBsffPackagingWhereInput(
  where: BsffPackagingWhere
): Prisma.BsffPackagingWhereInput {
  return toPrismaNestedWhereInput(where, toPrismaBsffPackagingSimpleWhereInput);
}
