import { prisma } from "@td/prisma";
import type { MutationResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getVhuAgrementOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteVhuAgrement } from "../../permissions";

/**
 * Delete a VHU agrement
 * @param id
 */
const deleteVhuAgrementResolver: MutationResolvers["deleteVhuAgrement"] =
  async (_, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const { id } = input;
    const receipt = await getVhuAgrementOrNotFound({ id });
    await checkCanReadUpdateDeleteVhuAgrement(user, receipt);
    return prisma.vhuAgrement.delete({ where: { id } });
  };

export default deleteVhuAgrementResolver;
