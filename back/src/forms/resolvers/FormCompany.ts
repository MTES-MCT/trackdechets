import { FormCompanyResolvers } from "../../generated/graphql/types";

const formCompanyResolvers: FormCompanyResolvers = {
  country: parent => {
    return parent.country || "FR";
  }
};

export default formCompanyResolvers;
