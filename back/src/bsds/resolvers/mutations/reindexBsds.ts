import { MutationResolvers } from "../../../generated/graphql/types";

import { checkIsAdmin } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { reindex, splitIntoBsdIds } from "../../indexation/reindexBsdHelpers";

const reindexBsdsResolver: MutationResolvers["reindexBsds"] = async (
  _,
  { ids },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);

  // Convert the input into actual BSD ids
  const bsdIds = splitIntoBsdIds(ids);

  await Promise.all(bsdIds.map(bsdId => reindex(bsdId, success => success)));

  return bsdIds;
};
export default reindexBsdsResolver;
