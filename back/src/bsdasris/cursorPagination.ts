import { UserInputError } from "apollo-server-express";
import * as yup from "yup";

type CursorPaginationArgs = {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  // default value for `first` and `last` if omitted
  defaultPaginateBy?: number;
  // max value for `first` and `last`
  maxPaginateBy?: number;
};

/**
 * Validate and convert GraphQL pagination args (first, last, cursorAfter, cursorBefore)
 * to Prisma connection arguments (first, last, after, before)
 *
 * Two paginations modes are possible:
 * - cursor forward pagination (first, cursorAfter)
 * - cursor backward pagination (last, cursorBefore)
 *
 * The following rules are applied
 * - if `first` is used `cursorAfter`  we start at the beginning of the list
 * - if `last` is used `cursorBefore`  we start at the end of the list
 * - if `after` is used without `first`, we set `first` to a default value
 * - if `before` is used without `last`, we set `last` to a default value
 * - if neither `first`, `last`, `cursorAfter` or `cursorBefore` is used,
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

export async function getCursorConnectionsArgs({
  first,
  after,
  last,
  before,
  defaultPaginateBy = 50,
  maxPaginateBy = 500
}: CursorPaginationArgs) {
  // validate number formats
  await getValidationSchema(maxPaginateBy).validate({ first, last });

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

  return {
    take: before ? -(defaultPaginateBy + 1) : defaultPaginateBy + 1,
    ...(first ? { take: first + 1 } : {}),
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    ...(last ? { take: -(last + 1) } : {}),
    ...(before ? { cursor: { id: before }, skip: 1 } : {}),
    requiredItems: Math.abs(first || last || defaultPaginateBy)
  };
}

const positiveInteger = yup
  .number()
  .nullable(true)
  .notRequired()
  .integer("`${path}` doit être un entier")
  .positive("`${path}` doit être positif");

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
