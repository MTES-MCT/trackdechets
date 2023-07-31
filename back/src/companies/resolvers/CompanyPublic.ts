import { CompanyPublicResolvers } from "../../generated/graphql/types";
import { genericCompanyReceiptResolvers } from "./CompanyPrivate";

const companyPublicResolvers: CompanyPublicResolvers = {
  ...genericCompanyReceiptResolvers
};

export default companyPublicResolvers;
