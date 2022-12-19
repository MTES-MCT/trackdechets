import { checkVAT } from "jsvat";
import {
  countries as vatCountries,
  isVat,
  isSiret,
  BAD_CHARACTERS_REGEXP
} from "../../common/constants/companySearchHelpers";
import { FormCompanyResolvers } from "../../generated/graphql/types";

const formCompanyResolvers: FormCompanyResolvers = {
  country: parent => {
    if (isVat(parent.vatNumber)) {
      // ignore parent.country
      const vatCountryCode = checkVAT(
        parent.vatNumber.replace(BAD_CHARACTERS_REGEXP, ""),
        vatCountries
      )?.country?.isoCode.short;
      return vatCountryCode ? vatCountryCode : parent.country ?? "FR";
    }
    if (isSiret(parent.siret)) {
      // ignore parent.country
      return "FR";
    }
    if (parent.country) {
      // only parent.country
      return parent.country;
    }
    return null;
  },
  /**
   * Fill orgId when the parent does not have it
   */
  orgId: parent => {
    if (parent.orgId) {
      return parent.orgId;
    }
    if (parent.siret) {
      return parent.siret;
    }
    if (parent.vatNumber) {
      return parent.vatNumber;
    }
  }
};

export default formCompanyResolvers;
