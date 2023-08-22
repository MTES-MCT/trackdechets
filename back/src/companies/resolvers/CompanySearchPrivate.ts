import { CompanySearchPrivateResolvers } from "../../generated/graphql/types";
import { genericCompanyReceiptResolvers } from "./CompanyPrivate";

const companySearchPrivateResolvers: CompanySearchPrivateResolvers = {
  ...genericCompanyReceiptResolvers
};

export default companySearchPrivateResolvers;
