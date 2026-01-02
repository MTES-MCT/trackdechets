import { URLResolver, JSONObjectResolver } from "graphql-scalars";
import DateTimeResolver from "./DateTimeResolver";

export default {
  URL: URLResolver,
  DateTime: DateTimeResolver,
  JSONObject: JSONObjectResolver
};
