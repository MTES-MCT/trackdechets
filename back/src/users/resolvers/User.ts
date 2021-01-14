import { convertUrls, getInstallation } from "../../companies/database";
import { UserResolvers, CompanyPrivate } from "../../generated/graphql/types";
import { getUserCompanies } from "../database";
import { searchCompany } from "../../companies/sirene";

const userResolvers: UserResolvers = {
  // Returns the list of companies a user belongs to
  // Information from TD, Sirene, and s3ic are merged
  // to make up an instance of CompanyPrivate
  companies: async parent => {
    const companies = await getUserCompanies(parent.id);
    return Promise.all(
      companies.map(async company => {
        let companyPrivate: CompanyPrivate = convertUrls(company);
        try {
          // try to set naf, libelleNaf and address from SIRENE database
          const { naf, libelleNaf, address } = await searchCompany(
            company.siret
          );
          companyPrivate = { ...companyPrivate, naf, libelleNaf, address };
        } catch {}

        // retrieves associated ICPE
        const installation = await getInstallation(company.siret);
        return { ...companyPrivate, installation };
      })
    );
  }
};

export default userResolvers;
