import type { MutationResolvers } from "@td/codegen-back";

import { checkIsAdmin } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { reindex } from "../../indexation/reindexBsdHelpers";
import { splitIntoBsdIds } from "../../indexation/reindexBsdsUtils";

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
      } catch (_) {
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
