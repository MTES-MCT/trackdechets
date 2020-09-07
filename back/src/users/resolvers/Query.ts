import { QueryResolvers } from "../../generated/graphql/types";
import me from "./queries/me";
import apiKey from "./queries/apiKey";

const Query: QueryResolvers = {
  me,
  apiKey
};

export default Query;
