import { GraphQLError } from "graphql";

export function numberInRange(value: any, min: number, max: number) {
  if (
    value === null ||
    typeof value === "undefined" ||
    isNaN(value) ||
    Number.isNaN(value) ||
    value === Number.NaN
  ) {
    throw new GraphQLError(`Value is not a number: ${value}`);
  }

  const num = parseInt(value, 10);

  if (!Number.isFinite(num)) {
    throw new GraphQLError(`Value is not a finite number: ${num}`);
  }

  if (num < min) {
    throw new GraphQLError(
      `Value is too small. The minimum acceptable value is ${min}`
    );
  }

  if (num > max) {
    throw new GraphQLError(
      `Value is too big. The maximum acceptable value is ${max}`
    );
  }

  return num;
}
