import type { QueryResolvers } from "@td/codegen-back";

const warningMessageResolver: QueryResolvers["warningMessage"] = async (
  parent,
  args,
  context
) => {
  return context.req.session.warningMessage ?? "";
};

export default warningMessageResolver;
