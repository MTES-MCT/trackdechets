import { MembershipRequestResolvers } from "@td/codegen-back";
import { redactOrShowEmail } from "../utils";
import { checkIsAuthenticated } from "../../common/permissions";

const membershipRequestResolvers: MembershipRequestResolvers = {
  sentTo: (parent, arg, context) => {
    const user = checkIsAuthenticated(context);

    return parent.sentTo.map(email => redactOrShowEmail(email, user.email));
  }
};

export default membershipRequestResolvers;
