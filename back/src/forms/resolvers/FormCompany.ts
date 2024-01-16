import { checkVAT } from "jsvat";
import {
  countries as vatCountries,
  isVat,
  isSiret,
  cleanClue
} from "@td/constants";
import { FormCompanyResolvers } from "../../generated/graphql/types";

const formCompanyResolvers: FormCompanyResolvers = {
  country: parent => {
    if (isVat(parent.vatNumber)) {
      // ignore parent.country
      const vatCountryCode = checkVAT(
        cleanClue(parent.vatNumber!),
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
    return parent.vatNumber!;
  }
};

export default formCompanyResolvers;
