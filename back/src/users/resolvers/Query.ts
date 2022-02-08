import { QueryResolvers } from "../../generated/graphql/types";
import me from "./queries/me";
import apiKey from "./queries/apiKey";
import invitation from "./queries/invitation";
import membershipRequest from "./queries/membershipRequest";
import myCompanies from "./queries/myCompanies";
import authorizedApplications from "./queries/authorizedApplications";
import accessTokens from "./queries/accessTokens";
import resetPassword from "./queries/resetPassword";

const Query: QueryResolvers = {
  me,
  apiKey,
  invitation,
  membershipRequest,
  myCompanies,
  authorizedApplications,
  accessTokens,
  resetPassword
};

export default Query;
