import { Prisma } from ".prisma/client";
import { safeInput } from "../forms/form-converter";
import { DateFilter, StringFilter, IdFilter } from "../generated/graphql/types";

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

type EnumFilter<E> = {
  _in?: E[];
  _eq?: E;
};

export function toPrismaEnumFilter<E>(enumFilter: EnumFilter<E>) {
  if (!enumFilter) {
    return undefined;
  }
  return safeInput({
    in: enumFilter._in,
    equals: enumFilter._eq
  });
}

export function toPrismaIdFilter(idFilter: IdFilter | undefined) {
  if (!idFilter) {
    return undefined;
  }
  return safeInput<Prisma.StringFilter>({
    equals: idFilter._eq,
    in: idFilter._in
  });
}

export function toPrismaStringFilter(
  stringFilter: StringFilter | undefined
): Prisma.StringFilter {
  if (!stringFilter) {
    return undefined;
  }

  return safeInput<Prisma.StringFilter>({
    equals: stringFilter._eq,
    in: stringFilter._in,
    contains: stringFilter._contains
  });
}
