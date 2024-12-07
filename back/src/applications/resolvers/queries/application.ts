import type { QueryResolvers } from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getApplicationOrApplicationNotFound } from "../../database";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { ForbiddenError } from "../../../common/errors";

const applicationResolver: QueryResolvers["application"] = async (
  _,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const application = await getApplicationOrApplicationNotFound({
    id: args.id
  });
  if (application.adminId !== user.id) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à consulter cette application"
    );
  }
  return application;
};

export default applicationResolver;
