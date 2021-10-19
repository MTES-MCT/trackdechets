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
 * Merge arrays and returns undefined if array is empty
 */
const cleanMerge = <A, B>(arr1: A[], arr2: B[]): (A | B)[] | undefined => {
  const merged = [...arr1, ...arr2];
  return !!merged.length ? merged : undefined;
};

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
    // we want to preserve existing top-level ANDs/ORs arrays coming from converter output,
    // we'll merge them if necessary

    const converted = converter(where);

    const _and = where?._and || [];
    const _or = where?._or || [];

    const arrayToInner = x => x.map(w => inner(w, depth + 1));

    return safeInput<P>({
      ...converted,
      AND: cleanMerge(arrayToInner(_and), converted["AND"] || []),
      OR: cleanMerge(arrayToInner(_or), converted["OR"] || []),
      NOT: where?._not ? inner(where._not, depth + 1) : undefined
    });
  }
  return inner(where);
}

/** Conversion logic common to all types of bsds */
export function toPrismaGenericWhereInput(where: GenericWhere) {
  return {
    ...(where?.id ? { id: toPrismaIdFilter(where.id) } : {}),
    isDraft: where?.isDraft,
    ...(where?.createdAt
      ? { createdAt: toPrismaDateFilter(where.createdAt) }
      : {}),
    ...(where?.updatedAt
      ? { updatedAt: toPrismaDateFilter(where.updatedAt) }
      : {})
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

type GenericWhereInput =
  | Prisma.BsffWhereInput
  | Prisma.BsdaWhereInput
  | Prisma.BsvhuWhereInput
  | Prisma.BsdasriWhereInput;

/**
 * This function applies a mask on a whereInput.
 * It is used to restrict bsds a user can read based on the
 * companies it belongs to.
 */
export function applyMask<W extends GenericWhereInput>(
  where: W,
  mask: Partial<W>
): W {
  const AND = where.AND
    ? Array.isArray(where.AND)
      ? where.AND
      : [where.AND]
    : [];

  return { ...where, AND: [...AND, mask] };
}
