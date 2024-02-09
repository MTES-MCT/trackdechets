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

  // Re-index all the BSD. Do not stop if one is faulty
  const results = await Promise.allSettled(
    bsdIds.map(async bsdId => {
      try {
        await reindex(bsdId, success => success);
      } catch (e) {
        throw new Error(bsdId);
      }
    })
  );

  // If there are errors
  const rejected = results
    .filter(res => res.status === "rejected")
    .map(res =>
      (res as PromiseRejectedResult).reason.toString().replace("Error: ", "")
    );

  const accepted = bsdIds.filter(id => !rejected.includes(id));

  return { accepted, rejected };
};
export default reindexBsdsResolver;
