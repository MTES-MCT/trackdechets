import { URLResolver, JSONObjectResolver } from "graphql-scalars";
import DateTimeResolver from "./DateTimeResolver";
import StringResolver from "./StringResolver";

export default {
  URL: URLResolver,
  DateTime: DateTimeResolver,
  String: StringResolver,
  JSONObject: JSONObjectResolver
};
