import { FormCompanyResolvers } from "@trackdechets/codegen/src/back.gen";

const formCompanyResolvers: FormCompanyResolvers = {
  country: parent => {
    return parent.country || "FR";
  }
};

export default formCompanyResolvers;
