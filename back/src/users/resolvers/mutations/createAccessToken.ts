import type { MutationResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { createAccessToken } from "../../database";

const createAccessTokenResolver: MutationResolvers["createAccessToken"] =
  async (_parent, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const accessToken = await createAccessToken({
      user,
      description: input.description
    });
    return {
      id: accessToken.id,
      token: accessToken.token,
      description: accessToken.description ?? ""
    };
  };

export default createAccessTokenResolver;
