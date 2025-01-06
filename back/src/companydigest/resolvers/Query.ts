import companyDigests from "./queries/companyDigests";
import companyDigestPdf from "./queries/companyDigestPdf";
import type { QueryResolvers } from "@td/codegen-back";

const Query: QueryResolvers = {
  companyDigests,
  companyDigestPdf
};

export default Query;
