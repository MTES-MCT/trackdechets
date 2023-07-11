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
    transporterCompanyVatNumber: toPrismaStringFilter(
      where.transporter?.company?.vatNumber
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
      : {}),
    ...(where?.ficheInterventions &&
    Object.keys(where?.ficheInterventions).length > 0
      ? {
          ficheInterventions: {
            some: safeInput({
              numero: toPrismaStringFilter(where.ficheInterventions.numero),
              detenteurCompanySiret: toPrismaStringFilter(
                where.ficheInterventions.detenteur?.company?.siret
              )
            })
          }
        }
      : {})
  });
}
export function toPrismaBsffWhereInput(
  where: BsffWhere | null | undefined
): Prisma.BsffWhereInput | undefined {
  if (!where) {
    return undefined;
  }
  return toPrismaNestedWhereInput(where, toPrismaBsffSimpleWhereInput);
}

export function toPrismaBsffPackagingSimpleWhereInput(
  where: BsffPackagingWhere
): Prisma.BsffPackagingWhereInput {
  const noTraceability = where.operation?.noTraceability;

  return safeInput<Prisma.BsffPackagingWhereInput>({
    numero: toPrismaStringFilter(where.numero),
    acceptationSignatureDate: toPrismaDateFilter(
      where.acceptation?.signature?.date
    ),
    acceptationWasteCode: toPrismaStringFilter(where.acceptation?.wasteCode),
    operationCode: toPrismaEnumFilter(where.operation?.code),
    ...(noTraceability === true || noTraceability === false
      ? { operationNoTraceability: noTraceability }
      : {}),
    operationSignatureDate: toPrismaDateFilter(
      where.operation?.signature?.date
    ),
    bsff: toPrismaBsffWhereInput(where.bsff),
    nextPackaging:
      where.nextBsff === null
        ? { is: null }
        : where.nextBsff
        ? { bsff: toPrismaBsffWhereInput(where.nextBsff) }
        : undefined
  });
}

export function toPrismaBsffPackagingWhereInput(
  where: BsffPackagingWhere
): Prisma.BsffPackagingWhereInput {
  return toPrismaNestedWhereInput(where, toPrismaBsffPackagingSimpleWhereInput);
}
