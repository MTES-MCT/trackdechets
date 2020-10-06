import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import { numberInRange } from "./util";

export const PositiveInt = new GraphQLScalarType({
  name: "PositiveInt",
  description: "Positive integer",
  parseValue(value) {
    return numberInRange(value, 0, Number.MAX_SAFE_INTEGER);
  },
  serialize(value) {
    return numberInRange(value, 0, Number.MAX_SAFE_INTEGER);
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.INT) {
      throw new GraphQLError(
        `Expected an integer value, but got a ${valueNode.kind}`,
        valueNode
      );
    }
    return numberInRange(valueNode.value, 0, Number.MAX_SAFE_INTEGER);
  }
});
