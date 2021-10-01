import { Prisma } from ".prisma/client";
import { UserInputError } from "apollo-server-express";
import { safeInput } from "../forms/form-converter";
import { DateFilter, StringFilter, IdFilter } from "../generated/graphql/types";

type EnumFilter<E> = {
  _in?: E[];
  _eq?: E;
};

export type NestedWhere<W> = {
  _or?: W[];
  _and?: W[];
  _not?: W;
};

export type GenericWhere = {
  id?: IdFilter;
  isDraft?: boolean;
  createdAt?: DateFilter;
  updatedAt?: DateFilter;
};

export class NestingWhereError extends UserInputError {
  constructor(depthLimit = 2) {
    super(
      `Vous ne pouvez pas imbriquer des opérations` +
        ` _and, _or et _not sur plus de ${depthLimit} niveaux`
    );
  }
}

/**
 * Recursively compose where input with OR, AND and NOT logic
 * until depth limit is reached
 */
export function toPrismaNestedWhereInput<W extends NestedWhere<W>, P>(
  where: W,
  converter: (where: W) => P,
  depthLimit = 2
) {
  function inner(where: W, depth = 0): Partial<P> {
    if (depth >= depthLimit) {
      throw new NestingWhereError(depthLimit);
    }
    return safeInput<P>({
      ...converter(where),
      AND: where._and?.map(w => inner(w, depth + 1)),
      OR: where._or?.map(w => inner(w, depth + 1)),
      NOT: where._not ? inner(where._not, depth + 1) : undefined
    });
  }
  return inner(where);
}

/** Conversion logic common to all types of bsds */
export function toPrismaGenericWhereInput(where: GenericWhere) {
  return {
    id: toPrismaIdFilter(where.id),
    isDraft: where.isDraft,
    createdAt: toPrismaDateFilter(where.createdAt),
    updatedAt: toPrismaDateFilter(where.updatedAt)
  };
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
