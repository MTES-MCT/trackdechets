import { convertUrls, getInstallation } from "../../companies/database";
import { UserResolvers, CompanyPrivate } from "../../generated/graphql/types";
import { getUserCompanies } from "../database";
import { nafCodes } from "../../common/constants/NAF";

const userResolvers: UserResolvers = {
  // Returns the list of companies a user belongs to
  // Information from TD and s3ic are merged
  // to make up an instance of CompanyPrivate
  companies: async parent => {
    const companies = await getUserCompanies(parent.id);
    return Promise.all(
      companies.map(async company => {
        let companyPrivate: CompanyPrivate = convertUrls(company);

        const { codeNaf: naf, address } = company;
        const libelleNaf = naf in nafCodes ? nafCodes[naf] : "";

        companyPrivate = { ...companyPrivate, naf, libelleNaf, address };

        // retrieves associated ICPE
        const installation = await getInstallation(company.siret);
        return { ...companyPrivate, installation };
      })
    );
  }
};

export default userResolvers;
