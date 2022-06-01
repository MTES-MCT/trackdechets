import { MembershipRequestResolvers } from "../../generated/graphql/types";
import { getEmailDomain, redactOrShowEmail } from "../utils";
import { checkIsAuthenticated } from "../../common/permissions";

const membershipRequestResolvers: MembershipRequestResolvers = {
  sentTo: (parent, arg, context) => {
    const user = checkIsAuthenticated(context);

    const userEmailDomain = getEmailDomain(user?.email);

    return parent.sentTo.map(email =>
      redactOrShowEmail(email, userEmailDomain)
    );
  }
};

export default membershipRequestResolvers;
