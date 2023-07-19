import { CompanyForVerificationResolvers } from "../../generated/graphql/types";

const companyForVerificationResolvers: CompanyForVerificationResolvers = {
  admin: async (parent, _, context) => {
    // returns first admin who joined
    return context.dataloaders.companiesAdmin.load(parent.id);
  }
};

export default companyForVerificationResolvers;
