import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { z } from "zod";
import {
  cloneBsda,
  cloneBsdasri,
  cloneBsff,
  cloneBsvhu,
  cloneBspaoh,
  cloneBsdd
} from "./utils/clone.utils";
import { checkIsAuthenticated } from "../../../common/permissions";

const idSchema = z.string().min(15).max(50);

// TODO: env var to enable on Dev only (back & front)
const cloneBsdResolver: MutationResolvers["cloneBsd"] = async (
  _,
  { id },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  await idSchema.parse(id);

  if (id.startsWith("BSDA-")) {
    await cloneBsda(id);
  } else if (id.startsWith("DASRI-")) {
    await cloneBsdasri(id);
  } else if (id.startsWith("FF-")) {
    await cloneBsff(id);
  } else if (id.startsWith("VHU-")) {
    await cloneBsvhu(id);
  } else if (id.startsWith("PAOH-")) {
    await cloneBspaoh(id);
  } else {
    await cloneBsdd(id);
  }

  return true;
};

export default cloneBsdResolver;
