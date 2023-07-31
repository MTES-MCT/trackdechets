import { GraphQLScalarType, Kind } from "graphql";
import { isValid, parseISO } from "date-fns";
import { UserInputError } from "../common/errors";

const INVALID_DATE_FORMAT = v =>
  `Seul les chaînes de caractères au format ISO 8601 sont acceptées en tant que date. Reçu ${v}.`;

function parseDate(value: string) {
  let parsed = new Date(value); // Convert incoming string to Date

  if (!isValid(parsed)) {
    // yyyy-MM-dd'T'HH:mm:ssX and yyyy-MM-dd'T'HH:mm:ss.SSSX
    // supported historically are not handled by new Date()
    // let's try parsing with date-fns parseISO
    parsed = parseISO(value);

    if (!isValid(parsed)) {
      throw new UserInputError(INVALID_DATE_FORMAT(value));
    }
  }
  return parsed;
}

export default new GraphQLScalarType({
  name: "DateTime",
  description: "Date custom scalar type",
  serialize(value: Date) {
    return value.toISOString(); // Convert outgoing Date to ISO string
  },
  parseValue(value) {
    if (typeof value !== "string") {
      throw new UserInputError(INVALID_DATE_FORMAT(value));
    }
    return parseDate(value);
  },
  parseLiteral(ast) {
    // value from client in ast
    if (ast.kind !== Kind.STRING) {
      throw new UserInputError(INVALID_DATE_FORMAT(ast.kind));
    }
    return parseDate(ast.value);
  }
});
