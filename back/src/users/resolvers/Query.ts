import { QueryResolvers } from "../../generated/graphql/types";
import me from "./queries/me";
import personalAccessTokens from "./queries/personalAccessTokens";
import invitation from "./queries/invitation";
import membershipRequest from "./queries/membershipRequest";

const Query: QueryResolvers = {
  me,
  personalAccessTokens,
  invitation,
  membershipRequest
};

export default Query;
