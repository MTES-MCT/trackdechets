import { PaginationArgs, validatePaginationArgs } from "../common/pagination";

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
}: PaginationArgs) {
  validatePaginationArgs({ first, after, last, before, maxPaginateBy });

  return {
    take: before ? -(defaultPaginateBy + 1) : defaultPaginateBy + 1,
    ...(first ? { take: first + 1 } : {}),
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    ...(last ? { take: -(last + 1) } : {}),
    ...(before ? { cursor: { id: before }, skip: 1 } : {}),
    requiredItems: Math.abs(first || last || defaultPaginateBy)
  };
}
