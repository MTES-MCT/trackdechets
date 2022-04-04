import { CompanyMemberResolvers } from "@trackdechets/codegen/src/back.gen";

const companyMemberResolvers: CompanyMemberResolvers = {
  isMe: (parent, _, context) => {
    return parent.id === context.user.id;
  }
};

export default companyMemberResolvers;
