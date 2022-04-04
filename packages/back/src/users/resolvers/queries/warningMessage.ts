import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";

const warningMessageResolver: QueryResolvers["warningMessage"] = async (
  parent,
  args,
  context
) => {
  return context.req.session.warningMessage;
};

export default warningMessageResolver;
