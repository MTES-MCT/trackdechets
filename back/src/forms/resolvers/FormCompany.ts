import { FormCompanyResolvers } from "../../generated/graphql/types";
import { checkVAT } from "jsvat";
import { countries } from "../../common/constants/companySearchHelpers";

const formCompanyResolvers: FormCompanyResolvers = {
  country: parent => {
    if (parent.country) {
      return parent.country;
    }
    if (parent.vatNumber) {
      const { country } = checkVAT(parent.vatNumber, countries);
      return country?.isoCode?.short;
    }
    if (parent.siret) {
      return "FR";
    }
    return null;
  }
};

export default formCompanyResolvers;
