import { UserInputError } from "apollo-server-core";
import * as yup from "yup";

export type PaginationArgs = {
  skip?: number;
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
export function getPrismaPaginationArgs(args: PaginationArgs) {
  validatePaginationArgs(args);

  const { before, after } = args;
  let first = args.first;
  let last = args.last;

  if (!first && !last) {
    const paginateBy = args.defaultPaginateBy ?? 50;

    if (args.before) {
      last = paginateBy;
    } else {
      first = paginateBy;
    }
  }

  return {
    ...(args.skip ? { skip: args.skip } : {}),
    ...(first ? { take: first + 1 } : {}),
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    ...(last ? { take: -last - 1 } : {}),
    ...(before ? { cursor: { id: before }, skip: 1 } : {})
  };
}

export function validatePaginationArgs({
  skip,
  first,
  after,
  last,
  before,
  maxPaginateBy = 500
}: PaginationArgs) {
  // validate number formats
  getValidationSchema(maxPaginateBy).validateSync({ first, last });

  if (first & last) {
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
