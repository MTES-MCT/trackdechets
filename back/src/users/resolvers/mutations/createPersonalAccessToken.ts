import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { createAccessToken, toAccessToken } from "../../database";

const createPersonalAccessTokenResolver: MutationResolvers["createPersonalAccessToken"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const accessToken = await createAccessToken(user);

  return toAccessToken(accessToken);
};

export default createPersonalAccessTokenResolver;
