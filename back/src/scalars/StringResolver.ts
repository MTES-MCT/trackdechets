import { GraphQLScalarType, Kind } from "graphql";
import xss, { IFilterXSSOptions } from "xss";
import { UserInputError } from "../common/errors";

const xssOptions: IFilterXSSOptions = { stripIgnoreTag: true };

export default new GraphQLScalarType({
  name: "String",
  description:
    "Custom String scalar type that make sure serialized string is XSS proof",
  serialize(value: string) {
    return xss(value, xssOptions);
  },
  parseValue(value) {
    if (typeof value !== "string") {
      throw new UserInputError("Invalid String");
    }
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new UserInputError("Invalid String");
    }
    return ast.value;
  }
});
