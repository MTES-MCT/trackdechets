import { QueryResolvers } from "../../../generated/graphql/types";

const warningMessageResolver: QueryResolvers["warningMessage"] = async (
  parent,
  args,
  context
) => {
  return context.req.session.warningMessage;
};

export default warningMessageResolver;
