import { FormCompanyResolvers } from "../../generated/graphql/types";

const formCompanyResolvers: FormCompanyResolvers = {
  country: parent => {
    return parent.siret ? parent.country || "FR" : null;
  }
};

export default formCompanyResolvers;
