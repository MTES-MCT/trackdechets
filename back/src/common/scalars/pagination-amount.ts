import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import { numberInRange } from "./util";

const MIN = 1;
const MAX = 500;

export const PaginationAmount = new GraphQLScalarType({
  name: "PaginationAmount",
  description: `Elements to return per page. Expects a positive integer between ${MIN} et ${MAX}`,
  parseValue(value) {
    return numberInRange(value, MIN, MAX);
  },
  serialize(value) {
    return numberInRange(value, MIN, MAX);
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.INT) {
      throw new GraphQLError(
        `Expected an integer value, but got a ${valueNode.kind}`,
        valueNode
      );
    }
    return numberInRange(valueNode.value, MIN, MAX);
  }
});
