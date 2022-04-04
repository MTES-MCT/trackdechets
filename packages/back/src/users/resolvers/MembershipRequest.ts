import { MembershipRequestResolvers } from "@trackdechets/codegen/src/back.gen";
import { partiallyHideEmail } from "../utils";

const membershipRequestResolvers: MembershipRequestResolvers = {
  sentTo: parent => parent.sentTo.map(email => partiallyHideEmail(email))
};

export default membershipRequestResolvers;
