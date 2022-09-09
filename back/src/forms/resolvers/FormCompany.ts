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
  }
};

export default formCompanyResolvers;
