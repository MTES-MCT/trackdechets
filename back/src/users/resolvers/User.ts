import { convertUrls } from "../../companies/database";
import { UserResolvers, CompanyPrivate } from "../../generated/graphql/types";
import { getUserCompanies } from "../database";
import { nafCodes } from "../../common/constants/NAF";

const userResolvers: UserResolvers = {
  // Returns the list of companies a user belongs to
  // Information from TD and s3ic are merged in a separate resolver (CompanyPrivate.installation)
  // to make up an instance of CompanyPrivate
  companies: async parent => {
    const companies = await getUserCompanies(parent.id);
    return companies.map(async company => {
      const companyPrivate: CompanyPrivate = convertUrls(company);

      const { codeNaf: naf, address } = company;
      const libelleNaf = naf in nafCodes ? nafCodes[naf] : "";

      return { ...companyPrivate, naf, libelleNaf, address };
    });
  }
};

export default userResolvers;
