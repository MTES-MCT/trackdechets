import { QueryResolvers } from "../../generated/graphql/types";
import me from "./queries/me";
import apiKey from "./queries/apiKey";
import invitation from "./queries/invitation";
import membershipRequest from "./queries/membershipRequest";
import myCompanies from "./queries/myCompanies";
import authorizedApplications from "./queries/authorizedApplications";
import accessTokens from "./queries/accessTokens";
import passwordResetRequest from "./queries/passwordResetRequest";
import warningMessage from "./queries/warningMessage";

const Query: QueryResolvers = {
  me,
  apiKey,
  invitation,
  membershipRequest,
  myCompanies,
  authorizedApplications,
  accessTokens,
  passwordResetRequest,
  warningMessage
};

export default Query;
