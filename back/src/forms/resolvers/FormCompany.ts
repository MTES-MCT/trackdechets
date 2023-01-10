import { FormCompanyResolvers } from "../../generated/graphql/types";

const formCompanyResolvers: FormCompanyResolvers = {
  country: parent => {
    if (parent.vatNumber) {
      return parent.country ?? "FR";
    }
    if (parent.siret) {
      return "FR";
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
