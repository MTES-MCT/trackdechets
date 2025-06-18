import type { QueryResolvers } from "@td/codegen-back";
import me from "./queries/me";
import apiKey from "./queries/apiKey";
import invitation from "./queries/invitation";
import membershipRequest from "./queries/membershipRequest";
import membershipRequests from "./queries/membershipRequests";
import myCompanies from "./queries/myCompanies";
import authorizedApplications from "./queries/authorizedApplications";
import accessTokens from "./queries/accessTokens";
import passwordResetRequest from "./queries/passwordResetRequest";
import warningMessage from "./queries/warningMessage";
import myCompaniesCsv from "./queries/myCompaniesCsv";
import myCompaniesXls from "./queries/myCompaniesXls";
import isAuthenticated from "./queries/isAuthenticated";
import permissionsInfos from "./queries/permissionsInfos";

const Query: QueryResolvers = {
  me,
  isAuthenticated,
  apiKey,
  invitation,
  membershipRequest,
  membershipRequests,
  myCompanies,
  authorizedApplications,
  accessTokens,
  passwordResetRequest,
  warningMessage,
  myCompaniesCsv,
  myCompaniesXls,
  permissionsInfos
};

export default Query;
