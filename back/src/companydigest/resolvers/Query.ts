import companyDigests from "./queries/companyDigests";
import companyDigestPdf from "./queries/companyDigestPdf";
import { QueryResolvers } from "../../generated/graphql/types";

const Query: QueryResolvers = {
  companyDigests,
  companyDigestPdf
};

export default Query;
