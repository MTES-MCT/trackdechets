import {
  BsffStatus,
  BsffWhere,
  BsffOperationCode
} from "../generated/graphql/types";
import { Prisma } from "@prisma/client";
import { safeInput } from "../forms/form-converter";
import {
  toPrismaIdFilter,
  toPrismaDateFilter,
  toPrismaEnumFilter,
  toPrismaStringFilter
} from "../common/where";
import { UserInputError } from "apollo-server-express";

export function toPrismaWhereInput(
  where: BsffWhere,
  depth = 0
): Prisma.BsffWhereInput {
  if (depth >= 2) {
    throw new UserInputError(
      "Vous ne pouvez pas imbriquer des opérations _and, _or, _not"
    );
  }
  return safeInput<Prisma.BsffWhereInput>({
    id: toPrismaIdFilter(where.id),
    isDraft: where.isDraft,
    status: toPrismaEnumFilter<BsffStatus>(where.status),
    createdAt: toPrismaDateFilter(where.createdAt),
    updatedAt: toPrismaDateFilter(where.updatedAt),
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
    ),
    AND: where._and?.map(item => toPrismaWhereInput(item, depth + 1)),
    OR: where._or?.map(item => toPrismaWhereInput(item, depth + 1)),
    NOT: toPrismaWhereInput(where._not, depth + 1)
  });
}
