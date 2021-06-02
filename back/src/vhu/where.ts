import { Prisma } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import { safeInput } from "../forms/form-converter";
import { BsvhuWhere, DateFilter } from "../generated/graphql/types";

export function convertWhereToDbFilter(
  where: BsvhuWhere
): Prisma.BsvhuWhereInput {
  if (!where) {
    return {};
  }

  const { _or, _and, _not, ...filters } = where;

  const hasOrNesting = _or?.some(w => w._or || w._and || w._not);
  const hasAndNesting = _and?.some(w => w._or || w._and || w._not);
  const hasNotNesting = _not?.some(w => w._or || w._and || w._not);

  if (hasOrNesting || hasAndNesting || hasNotNesting) {
    throw new UserInputError("Cannot nest conditions deeper than one level");
  }

  return safeInput({
    OR: _or?.map(w => toPrismaFilter(w)),
    AND: _and?.map(w => toPrismaFilter(w)),
    NOT: _not?.map(w => toPrismaFilter(w)),
    ...toPrismaFilter(filters)
  });
}

function toPrismaFilter(where: Omit<BsvhuWhere, "_or" | "_and" | "_not">) {
  return safeInput<Prisma.BsvhuWhereInput>({
    createdAt: toPrismaDateFilter(where.createdAt),
    updatedAt: toPrismaDateFilter(where.updatedAt),
    transporterCompanySiret: where.transporter?.company?.siret,
    transporterTransportSignatureDate: toPrismaDateFilter(
      where.transporter?.transport?.signature?.date
    ),
    emitterCompanySiret: where.emitter?.company?.siret,
    emitterEmissionSignatureDate: toPrismaDateFilter(
      where.emitter?.emission?.signature?.date
    ),
    destinationCompanySiret: where.destination?.company?.siret,
    destinationOperationSignatureDate: toPrismaDateFilter(
      where.destination?.operation?.signature?.date
    ),
    status: where.status,
    isDraft: where.isDraft
  });
}

export function toPrismaDateFilter(
  dateFilter: DateFilter | undefined
): Prisma.DateTimeFilter {
  if (!dateFilter) {
    return undefined;
  }

  return safeInput<Prisma.DateTimeFilter>({
    gt: dateFilter._gt,
    gte: dateFilter._gte,
    lt: dateFilter._lt,
    lte: dateFilter._lte,
    equals: dateFilter._eq
  });
}
