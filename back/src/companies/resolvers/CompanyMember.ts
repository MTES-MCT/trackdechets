import { CompanyMemberResolvers } from "../../generated/graphql/types";

const companyMemberResolvers: CompanyMemberResolvers = {
  isMe: (parent, _, context) => {
    return context.user && parent.id === context.user.id;
  }
};

export default companyMemberResolvers;
