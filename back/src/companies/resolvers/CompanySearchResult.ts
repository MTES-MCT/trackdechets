import { CompanySearchResultResolvers } from "../../generated/graphql/types";
import { genericCompanyReceiptResolvers } from "./CompanyPrivate";

const companySearchResultResolvers: CompanySearchResultResolvers = {
  ...genericCompanyReceiptResolvers
};

export default companySearchResultResolvers;
