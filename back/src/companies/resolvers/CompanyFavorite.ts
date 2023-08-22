import { CompanyFavoriteResolvers } from "../../generated/graphql/types";
import { genericCompanyReceiptResolvers } from "./CompanyPrivate";

const companyFavoriteResolvers: CompanyFavoriteResolvers = {
  ...genericCompanyReceiptResolvers
};

export default companyFavoriteResolvers;
