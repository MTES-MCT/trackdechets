import { MutationResolvers } from "@trackdechets/codegen/src/back.gen";
import { checkIsAuthenticated } from "../../../common/permissions";
import { createBsff } from "../../database";

const createBsffResolver: MutationResolvers["createBsff"] = async (
  _,
  { input },
  context
) => {
  const user = checkIsAuthenticated(context);
  return createBsff(user, input);
};

export default createBsffResolver;
