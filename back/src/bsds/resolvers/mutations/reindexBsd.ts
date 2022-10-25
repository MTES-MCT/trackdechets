import { MutationResolvers } from "../../../generated/graphql/types";

import { checkIsAdmin } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { reindex } from "../../indexation/reindexBsdHelpers";

const reindexBsdResolver: MutationResolvers["reindexBsd"] = async (
  _,
  { id: bsdId },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);
  return reindex(bsdId, success => success);
};
export default reindexBsdResolver;
