import { QueryResolvers } from "../../generated/graphql/types";
import me from "./queries/me";
import invitation from "./queries/invitation";
import membershipRequest from "./queries/membershipRequest";
import personalAccessTokens from "./queries/personalAccessTokens";
import linkedApplications from "./queries/linkedApplications";

const Query: QueryResolvers = {
  me,
  invitation,
  membershipRequest,
  personalAccessTokens,
  linkedApplications
};

export default Query;
