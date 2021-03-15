import { UserInputError } from "apollo-server-express";
import * as yup from "yup";

type PaginationArgs = {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  defaultPaginateBy?: number;
  maxPaginateBy?: number;
};

export async function getConnectionsArgs({
  first,
  after,
  last,
  before,
  defaultPaginateBy = 50,
  maxPaginateBy = 500
}: PaginationArgs) {
  // validate number formats
  getValidationSchema(maxPaginateBy).validate({ first, last });

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
    take: before ? -defaultPaginateBy - 1 : defaultPaginateBy + 1, // Default value
    ...(first ? { take: first + 1 } : {}),
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
    ...(last ? { take: -last - 1 } : {}),
    ...(before ? { cursor: { id: before }, skip: 1 } : {})
  };
}

const positiveInteger = yup
  .number()
  .nullable(true)
  .notRequired()
  .integer("`${path}` doit être un entier")
  .positive("`${path}` doit être positif");

const getValidationSchema = maxPaginateBy =>
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
