import { QueryDslQueryContainer } from "@elastic/elasticsearch/api/types";
import { Prisma } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import { safeInput } from "../common/converter";
import {
  DateFilter,
  StringFilter,
  IdFilter,
  StringNullableListFilter,
  TextFilter
} from "../generated/graphql/types";

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
        ` _and, _or et _not sur plus de ${depthLimit - 1} niveaux`
    );
  }
}

export class MaxLengthSearchError extends UserInputError {
  constructor(fieldName: string, maxLength: number) {
    super(
      `La longueur maximale du paramètre de recherche ${fieldName} est de ${maxLength} caractères`
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

export function toPrismaRelationIdFilter(idFilter: IdFilter | undefined) {
  if (!idFilter) {
    return undefined;
  }

  if (idFilter._eq === null) {
    return { is: null };
  }

  return {
    id: safeInput<Prisma.StringFilter>({
      equals: idFilter._eq,
      in: idFilter._in
    })
  };
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

/** Converter */
export function toPrismaStringNullableListFilter(
  stringNullableListFilter: StringNullableListFilter | undefined
): Prisma.StringNullableListFilter {
  if (!stringNullableListFilter) {
    return undefined;
  }

  return safeInput<Prisma.StringNullableListFilter>({
    hasSome: stringNullableListFilter._hasSome ?? stringNullableListFilter._in,
    equals: stringNullableListFilter._eq,
    has: stringNullableListFilter._has,
    hasEvery: stringNullableListFilter._hasEvery
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

// Conversion functions between GraphQL filters and Elastic query

function ngramMatch(fieldName: string, value: string): QueryDslQueryContainer {
  return {
    match: {
      [`${fieldName}.ngram`]: {
        // upper limit 5 should be the same as max_gram in ngram_tokenizer
        query: value.match(/.{1,5}/g).join(" "),
        operator: "and"
      }
    }
  };
}

export function toElasticTextQuery(
  fieldName: string,
  textFilter: TextFilter | undefined,
  maxLength = 50
): QueryDslQueryContainer {
  if (!textFilter) {
    return undefined;
  }
  if (textFilter._match?.length > maxLength) {
    throw new MaxLengthSearchError(fieldName, maxLength);
  }
  return {
    bool: {
      should: [
        {
          match: {
            [fieldName]: {
              query: textFilter._match,
              fuzziness: 0,
              operator: "and"
            }
          }
        },
        ngramMatch(fieldName, textFilter._match)
      ]
    }
  };
}

export function toElasticStringQuery(
  fieldName: string,
  stringFilter: StringFilter | undefined,
  maxLength = 50
): QueryDslQueryContainer {
  if (!stringFilter) {
    return undefined;
  }

  if (
    stringFilter._eq?.length > maxLength ||
    stringFilter._contains?.length > maxLength ||
    stringFilter._in?.some(s => s.length > maxLength)
  ) {
    throw new MaxLengthSearchError(fieldName, maxLength);
  }

  if (stringFilter._eq) {
    return { term: { [fieldName]: stringFilter._eq } };
  }

  if (stringFilter._contains) {
    return ngramMatch(fieldName, stringFilter._contains);
  }

  if (stringFilter._in) {
    return { terms: { [fieldName]: stringFilter._in } };
  }
}

export function toElasticStringListQuery(
  fieldName: string,
  stringListFilter: StringNullableListFilter | undefined,
  maxLength = 50
): QueryDslQueryContainer {
  if (!stringListFilter) {
    return undefined;
  }

  if (
    stringListFilter._hasEvery?.some(s => s.length > maxLength) ||
    stringListFilter._hasSome?.some(s => s.length > maxLength) ||
    stringListFilter._in?.some(s => s.length > maxLength) ||
    stringListFilter._has?.length > maxLength ||
    stringListFilter._itemContains?.length > maxLength
  ) {
    throw new MaxLengthSearchError(fieldName, maxLength);
  }

  if (stringListFilter._hasEvery) {
    return {
      bool: {
        must: stringListFilter._hasEvery.map(value => ({
          term: { [fieldName]: value }
        }))
      }
    };
  }

  if (stringListFilter._hasSome || stringListFilter._in) {
    return {
      terms: {
        [fieldName]: stringListFilter._hasSome ?? stringListFilter._in
      }
    };
  }

  if (stringListFilter._has) {
    return { term: { [fieldName]: stringListFilter._has } };
  }

  if (stringListFilter._itemContains) {
    return ngramMatch(fieldName, stringListFilter._itemContains);
  }

  throw new UserInputError("_eq n'est pas implémenté sur la query `bsds`");
}

export function toElasticDateQuery(
  fieldName: string,
  dateFilter: DateFilter | undefined
): QueryDslQueryContainer {
  if (!dateFilter) {
    return undefined;
  }

  if (dateFilter._eq) {
    return { match: { [fieldName]: dateFilter._eq.getTime() } };
  }

  if (dateFilter._gt && dateFilter._gte) {
    throw new UserInputError(
      "Vous ne pouvez pas filtrer par _gt et _gte en même temps"
    );
  }
  if (dateFilter._lt && dateFilter._lte) {
    throw new UserInputError(
      "Vous ne pouvez pas filtrer par _lt et _lte en même temps"
    );
  }

  return {
    range: {
      [fieldName]: {
        ...(dateFilter._gt ? { gt: new Date(dateFilter._gt).getTime() } : {}),
        ...(dateFilter._gte
          ? { gte: new Date(dateFilter._gte).getTime() }
          : {}),
        ...(dateFilter._lt ? { lt: new Date(dateFilter._lt).getTime() } : {}),
        ...(dateFilter._lte ? { lte: new Date(dateFilter._lte).getTime() } : {})
      }
    }
  };
}
