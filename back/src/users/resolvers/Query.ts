import { QueryResolvers } from "../../generated/graphql/types";
import me from "./queries/me";
import apiKey from "./queries/apiKey";
import invitation from "./queries/invitation";
import membershipRequest from "./queries/membershipRequest";
import myCompanies from "./queries/myCompanies";

const Query: QueryResolvers = {
  me,
  apiKey,
  invitation,
  membershipRequest,
  myCompanies
};

export default Query;
