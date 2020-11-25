import { UserInputError } from "apollo-server-express";
import * as yup from "yup";

type PaginationArgs = {
  skip?: number;
  first?: number;
  cursorAfter?: string;
  last?: number;
  cursorBefore?: string;
  // default value for `first` and `last` if omitted
  defaultPaginateBy?: number;
  // max value for `first` and `last`
  maxPaginateBy?: number;
};

const positiveInteger = yup
  .number()
  .nullable(true)
  .notRequired()
  .integer("`${path}` doit être un entier")
  .positive("`${path}` doit être positif"); // strictly positive (n > 0)

/**
 * Validate and convert GraphQL pagination args (skip, first, last, cursorAfter, cursorBefore)
 * to Prisma connection arguments (skip, first, last, after, before)
 *
 * Four paginations modes are possible:
 * - offset forward pagination (first, skip)
 * - offset backward pagination (last, skip)
 * - cursor forward pagination (first, cursorAfter)
 * - cursor backward pagination (last, cursorBefore)
 *
 * The following rules are applied
 * - if `first` is used without `skip` or `cursorAfter`  we start at the beginning of the list
 * - if `last` is used without `skip` or `cursorBefore`  we start at the end of the list
 * - if `cursorAfter` is used without `first`, we set `first` to a default value
 * - if `cursorBefore` is used without `last`, we set `last` to a default value
 * - if `skip` is used without `first` or `last`, we default to forward pagination and set `first` to a default value
 * - if neither `skip`, `first`, `last`, `cursorAfter` or `cursorBefore` is used,
 * we default to forward pagination from the beginning of the list and set `first` to a default value
 *
 * Any other combinations of inputs (for example passing `first` and `cursorBefore`) causes an error to be thrown
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
 * - https://v1.prisma.io/docs/1.34/prisma-client/basic-data-access/reading-data-JAVASCRIPT-rsc2/#pagination
 * - https://graphql.org/learn/pagination/
 * - https://relay.dev/graphql/connections.htm#sec-Backward-pagination-arguments
 */
export function getConnectionsArgs(args: PaginationArgs) {
  const maxPaginateBy = args.maxPaginateBy ?? 1000;

  const validationSchema = yup.object().shape<PaginationArgs>({
    first: positiveInteger.max(
      maxPaginateBy,
      `\`first\` doit être inférieur à ${maxPaginateBy}`
    ),
    last: positiveInteger.max(
      maxPaginateBy,
      `\`last\` doit être inférieur à ${maxPaginateBy}`
    ),
    skip: positiveInteger,
    defaultPaginateBy: positiveInteger
  });

  // validate number formats
  validationSchema.validateSync(args);

  if (args.first & args.last) {
    throw new UserInputError(
      "L'utilisation simultanée de `first` et `last` n'est pas supportée"
    );
  }

  if (args.cursorAfter && args.cursorBefore) {
    throw new UserInputError(
      "L'utilisation simultanée de `cursorAfter` et `cursorBefore` n'est pas supportée"
    );
  }

  if (args.first && args.cursorBefore) {
    throw new UserInputError(
      "`first` ne peut pas être utilisé en conjonction avec `cursorBefore`"
    );
  }

  if (args.last && args.cursorAfter) {
    throw new UserInputError(
      "`last` ne peut pas être utilisé en conjonction avec `cursorAfter`"
    );
  }

  if ((args.skip && args.cursorAfter) || (args.skip && args.cursorBefore)) {
    throw new UserInputError(
      "`skip` (pagination par offset) ne peut pas être utilisé en conjonction avec `cursorAfter` ou `cursorBefore` (pagination par curseur)"
    );
  }

  let first = args.first;
  let last = args.last;

  if (!first && !last) {
    const paginateBy = args.defaultPaginateBy ?? 50;

    if (args.cursorBefore) {
      last = args.defaultPaginateBy ?? paginateBy;
    } else {
      first = args.defaultPaginateBy ?? paginateBy;
    }
  }

  return {
    ...(args.skip ? { skip: args.skip } : {}),
    ...(first ? { take: first } : {}),
    ...(last ? { take: -last } : {}),
    ...(args.cursorAfter
      ? { cursor: { id: args.cursorAfter }, skip: (args.skip ?? 0) + 1 }
      : {}),
    ...(args.cursorBefore
      ? { cursor: { id: args.cursorBefore }, skip: (args.skip ?? 0) + 1 }
      : {})
  };
}
