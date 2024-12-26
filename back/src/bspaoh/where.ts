import { Prisma, BspaohStatus } from "@prisma/client";

import { safeInput } from "../common/converter";

import type { BspaohWhere } from "@td/codegen-back";
import {
  toPrismaDateFilter,
  toPrismaStringFilter,
  toPrismaNestedWhereInput,
  toPrismaIdFilter,
  toPrismaEnumFilter,
  GenericWhere,
  toPrismaStringNullableListFilter
} from "../common/where";

export function toPrismaGenericWhereInput(where: GenericWhere) {
  return {
    ...(where?.id ? { id: toPrismaIdFilter(where.id) } : {}),
    // ...(where?.isDraft !== null ? { isDraft: where.isDraft } : {}),
    ...(where?.createdAt
      ? { createdAt: toPrismaDateFilter(where.createdAt) }
      : {}),
    ...(where?.updatedAt
      ? { updatedAt: toPrismaDateFilter(where.updatedAt) }
      : {})
  };
}

/**
 * We dont have a isDraft boolean on bspaoh but a DRAFT status.
 * However we keep the isDraft in inputs, so we have to ensure compatibility
 * by transforming the status.isDraft gql input to a prisma status input
 * @param where
+----------------+-----------+------------------------+--------------+
| status\isDraft | undefined | false                  | true         |
+----------------+-----------+------------------------+--------------+
| INITIAL        | unchanged | unchanged              | equals Draft |
| OTHERS         | unchanged | unchanged              | err          |
| nop            | nop       | nonDraftBspaohStatuses | equals Draft |
+----------------+-----------+------------------------+--------------+
 */
function getCompatStatus(where) {
  const isDraft = where?.isDraft;
  const statusFilter = toPrismaEnumFilter(where.status);

  if (isDraft === undefined) {
    return statusFilter;
  }
  if (isDraft) {
    if (statusFilter?.equals === BspaohStatus.INITIAL) {
      return { equals: BspaohStatus.DRAFT };
    }
    if (statusFilter?.in) {
      return {
        in: statusFilter.in.map(el =>
          el === BspaohStatus.INITIAL ? BspaohStatus.DRAFT : el
        )
      };
    }
    if (!statusFilter) {
      return { equals: BspaohStatus.DRAFT };
    }
  }

  if (!isDraft) {
    if (!statusFilter) {
      return {
        not: BspaohStatus.DRAFT
      };
    }
  }
  return undefined;
}
function toPrismaBpaohWhereInput(where: BspaohWhere): Prisma.BspaohWhereInput {
  const genericInput = toPrismaGenericWhereInput(where);

  // status and isDraft compatibility
  const status = getCompatStatus(
    where
  ) as Prisma.EnumBspaohStatusFilter<"Bspaoh">;

  return safeInput<Prisma.BspaohWhereInput>({
    ...genericInput,
    status,
    emitterCompanySiret: toPrismaStringFilter(where.emitter?.company?.siret),
    emitterEmissionSignatureDate: toPrismaDateFilter(
      where.emitter?.emission?.signature?.date
    ),
    emitterCustomInfo: toPrismaStringFilter(where.emitter?.customInfo),

    ...(where?.transporter && Object.keys(where?.transporter).length > 0
      ? {
          transporters: {
            some: {
              transporterCompanySiret: toPrismaStringFilter(
                where.transporter?.company?.siret
              ),
              transporterCompanyVatNumber: toPrismaStringFilter(
                where.transporter?.company?.vatNumber
              ),
              transporterCustomInfo: toPrismaStringFilter(
                where.transporter?.customInfo
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
    destinationCustomInfo: toPrismaStringFilter(where.destination?.customInfo)
  });
}

export function toPrismaWhereInput(
  where: BspaohWhere
): Prisma.BspaohWhereInput {
  return toPrismaNestedWhereInput(where, toPrismaBpaohWhereInput);
}
