import { QueryResolvers } from "../../generated/graphql/types";
import me from "./queries/me";
import apiKey from "./queries/apiKey";
import invitation from "./queries/invitation";

const Query: QueryResolvers = {
  me,
  apiKey,
  invitation
};

export default Query;
