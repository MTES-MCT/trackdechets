import { ForbiddenError } from "apollo-server-express";
import { Appendix2FormResolvers } from "../../generated/graphql/types";

const appendix2FormResolvers: Appendix2FormResolvers = {
  emitter: (parent, _, { user }) => {
    console.log(user);
    throw new ForbiddenError("Not Authorized");
    return parent.emitter;
  }
};

export default appendix2FormResolvers;
