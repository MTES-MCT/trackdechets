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

const cloneBsdResolver: MutationResolvers["cloneBsd"] = async (
  _,
  { id },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  await idSchema.parse(id);

  let newBsd;
  if (id.startsWith("BSDA-")) {
    newBsd = await cloneBsda(user, id);
  } else if (id.startsWith("DASRI-")) {
    newBsd = await cloneBsdasri(user, id);
  } else if (id.startsWith("FF-")) {
    newBsd = await cloneBsff(user, id);
  } else if (id.startsWith("VHU-")) {
    newBsd = await cloneBsvhu(user, id);
  } else if (id.startsWith("PAOH-")) {
    newBsd = await cloneBspaoh(user, id);
  } else {
    newBsd = await cloneBsdd(user, id);
  }

  return { id: newBsd.id };
};

export default cloneBsdResolver;
