import { MembershipRequestResolvers } from "../../generated/graphql/types";
import { partiallyHideEmail } from "../utils";

const membershipRequestResolvers: MembershipRequestResolvers = {
  sentTo: parent => parent.sentTo.map(email => partiallyHideEmail(email))
};

export default membershipRequestResolvers;
