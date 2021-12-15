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
      "L'utilisation simultanée de `cursorAfter` et `cursorBefore` n'est pas supportée"
    );
  }

  if (first && before) {
    throw new UserInputError(
      "`first` ne peut pas être utilisé en conjonction avec `cursorBefore`"
    );
  }

  if (last && after) {
    throw new UserInputError(
      "`last` ne peut pas être utilisé en conjonction avec `cursorAfter`"
    );
  }

  if ((skip && after) || (skip && before)) {
    throw new UserInputError(
      "`skip` (pagination par offset) ne peut pas être utilisé en conjonction avec `cursorAfter` ou `cursorBefore` (pagination par curseur)"
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
