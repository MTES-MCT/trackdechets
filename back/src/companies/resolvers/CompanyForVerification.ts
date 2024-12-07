import type { CompanyForVerificationResolvers } from "@td/codegen-back";

const companyForVerificationResolvers: CompanyForVerificationResolvers = {
  admin: async (parent, _, context) => {
    // returns first admin who joined
    return context.dataloaders.companiesAdmin.load(parent.id);
  }
};

export default companyForVerificationResolvers;
