import * as yup from "yup";
import type { PageInfo } from "@td/codegen-back";
import { UserInputError } from "./errors";

const DEFAULT_PAGINATE_BY = 50;
const MAX_PAGINATE_BY = 500;

export type GraphqlPaginationArgs = {
  skip?: number | null;
  first?: number | null;
  after?: string | null;
  last?: number | null;
  before?: string | null;
};

// https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination
export type PrismaPaginationArgs = {
  skip?: number;
  take: number;
  cursor?: { id: string };
};

type PrismaGetConnectionArgs<T extends { id: string }, N> = {
  totalCount: number;
  findMany: (args: PrismaPaginationArgs) => Promise<T[]>;
  // a function used to convert prisma resource to connection node type
  formatNode: (r: T) => N;
} & GraphqlPaginationArgs;

type GraphqlConnection<N> = {
  totalCount: number;
  pageInfo: PageInfo;
  edges: { cursor: string; node: N }[];
};

export async function getConnection<T extends { id: string }, N>(
  args: PrismaGetConnectionArgs<T, N>
): Promise<GraphqlConnection<N>> {
  const gqlPaginationArgs = {
    first: args.first,
    after: args.after,
    last: args.last,
    before: args.before,
    skip: args.skip
  };

  // validate graphql pagination args
  validateGqlPaginationArgs(gqlPaginationArgs);

  // convert to prisma pagination args
  const { skip, take, cursor } = getPrismaPaginationArgs(gqlPaginationArgs);

  // retrieves page of records
  const records = await args.findMany({
    skip,
    // take one extra record to know if there is a next page
    take: take > 0 ? take + 1 : take - 1,
    cursor
  });

  const hasOtherPage = records.length > Math.abs(take);

  const slice = hasOtherPage
    ? take > 0
      ? records.slice(0, take)
      : records.slice(1)
    : records;

  const edges = slice.map(r => ({
    node: args.formatNode(r),
    cursor: r.id
  }));

  return {
    totalCount: args.totalCount,
    edges,
    pageInfo: {
      startCursor: edges[0]?.cursor,
      endCursor: edges[edges.length - 1]?.cursor,
      hasNextPage: take > 0 ? hasOtherPage : !!args.before,
      hasPreviousPage: take < 0 ? hasOtherPage : !!args.after
    }
  };
}

export type PrismaRelativePaginationArgs<T extends Record<string, any>> = {
  skip?: number;
  take: number;
  cursor?: { [key in keyof T]: string };
};

type PrismaGetRelativeConnectionArgs<T extends Record<string, any>, N> = {
  findMany: (args: PrismaRelativePaginationArgs<T>) => Promise<T[]>;
  // a function used to convert prisma resource to connection node type
  formatNode: (r: T) => N;
} & GraphqlPaginationArgs;

type GraphqlRelativeConnection<N> = {
  pageInfo: PageInfo;
  edges: { cursor: string; node: N }[];
};

export async function getRelativeConnection<T extends Record<string, any>, N>(
  args: Exclude<PrismaGetRelativeConnectionArgs<T, N>, "skip" | "totalCount">,
  cursorKey: keyof T = "id"
): Promise<GraphqlRelativeConnection<N>> {
  const gqlPaginationArgs = {
    first: args.first,
    after: args.after,
    last: args.last,
    before: args.before,
    skip: args.skip
  };

  // validate graphql pagination args
  validateGqlPaginationArgs(gqlPaginationArgs);

  // convert to prisma pagination args
  const { skip, take, cursor } = getPrismaPaginationArgs(gqlPaginationArgs);

  // retrieves page of records
  const records = await args.findMany({
    skip,
    // take one extra record to know if there is a next page
    take: take > 0 ? take + 1 : take - 1,
    cursor: cursor
      ? ({ [cursorKey]: cursor.id } as { [key in keyof T]: string })
      : undefined
  });

  const hasOtherPage = records.length > Math.abs(take);

  const slice = hasOtherPage
    ? take > 0
      ? records.slice(0, take)
      : records.slice(1)
    : records;

  const edges = slice.map(r => ({
    node: args.formatNode(r),
    cursor: r[cursorKey]
  }));

  return {
    edges,
    pageInfo: {
      startCursor: edges[0]?.cursor,
      endCursor: edges[edges.length - 1]?.cursor,
      hasNextPage: take > 0 ? hasOtherPage : !!args.before,
      hasPreviousPage: take < 0 ? hasOtherPage : !!args.after
    }
  };
}

/**
 * Validate and convert GraphQL pagination args (first, last, after, before)
 * to Prisma connection arguments (take, skip, cursor)
 *
 * Two paginations modes are possible:
 * - cursor forward pagination (first, after)
 * - cursor backward pagination (last, before)
 *
 * The following rules are applied
 * - if `first` is used  we start at the beginning of the list
 * - if `last` is used we start at the end of the list
 * - if `after` is used without `first`, we set `first` to a default value
 * - if `before` is used without `last`, we set `last` to a default value
 * - if neither `first`, `last`, `after` or `before` is used,
 * we default to forward pagination from the beginning of the list and set `first` to a default value
 *
 * Any other combinations of inputs (for example passing `first` and `before`) causes an error to be thrown
 *
 * The resulting connection arguments can be used with extra ordering argument that will influence the resulting pages
 * ordering.
 *
 * Suppose the following list [A, B, C, D, E]
 * (first: 2, after: C, orderBy: *ASC) => [D, E]
 * (last: 2, before: C, orderBy: *ASC) => [A, B]
 * (first: 2, after: C, orderBy: *DESC) => [B, A]
 * (last: 2, before: C, orderBy: *DESC) => [E, D]
 *
 * See also
 * - https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination
 * - https://graphql.org/learn/pagination/
 * - https://relay.dev/graphql/connections.htm#sec-Backward-pagination-arguments
 */
export function getPrismaPaginationArgs(
  args: GraphqlPaginationArgs & {
    defaultPaginateBy?: number;
    maxPaginateBy?: number;
  }
): PrismaPaginationArgs {
  validateGqlPaginationArgs(args);

  const { before, after } = args;
  let first = args.first;
  let last = args.last;

  if (!first && !last) {
    const paginateBy = args.defaultPaginateBy ?? DEFAULT_PAGINATE_BY;

    if (args.before) {
      last = paginateBy;
    } else {
      first = paginateBy;
    }
  }

  return {
    ...(args.skip ? { skip: args.skip } : {}),
    ...(first ? { take: first } : {}),
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    ...(last ? { take: -last } : {}),
    ...(before ? { cursor: { id: before }, skip: 1 } : {})
  } as PrismaPaginationArgs;
}

export function validateGqlPaginationArgs({
  skip,
  first,
  after,
  last,
  before,
  maxPaginateBy = MAX_PAGINATE_BY
}: GraphqlPaginationArgs & { maxPaginateBy?: number }) {
  // validate number formats
  getValidationSchema(maxPaginateBy).validateSync({ first, last });

  if (first && last) {
    throw new UserInputError(
      "L'utilisation simultanée de `first` et `last` n'est pas supportée"
    );
  }

  if (after && before) {
    throw new UserInputError(
      "L'utilisation simultanée de `after` et `before` n'est pas supportée"
    );
  }

  if (first && before) {
    throw new UserInputError(
      "`first` ne peut pas être utilisé en conjonction avec `before`"
    );
  }

  if (last && after) {
    throw new UserInputError(
      "`last` ne peut pas être utilisé en conjonction avec `after`"
    );
  }

  if ((skip && after) || (skip && before)) {
    throw new UserInputError(
      "`skip` (pagination par offset) ne peut pas être utilisé en conjonction avec `after` ou `before` (pagination par curseur)"
    );
  }
}

const positiveInteger = yup
  .number()
  .nullable(true)
  .notRequired()
  .integer("`${path}` doit être un entier")
  .positive("`${path}` doit être positif"); // strictly positive (n > 0)

const getValidationSchema = (maxPaginateBy: number) =>
  yup.object().shape({
    first: positiveInteger.max(
      maxPaginateBy,
      `\`first\` doit être inférieur à ${maxPaginateBy}`
    ),
    last: positiveInteger.max(
      maxPaginateBy,
      `\`last\` doit être inférieur à ${maxPaginateBy}`
    )
  });
