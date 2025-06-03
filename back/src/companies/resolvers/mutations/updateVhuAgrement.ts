import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { getVhuAgrementOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteVhuAgrement } from "../../permissions";
import { removeEmptyKeys } from "../../../common/converter";

/**
 * Update a VHu agrement
 * @param input
 */
const updateVhuAgrementResolver: MutationResolvers["updateVhuAgrement"] =
  async (_, args, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const {
      input: { id, ...data }
    } = args;
    const receipt = await getVhuAgrementOrNotFound({ id });
    await checkCanReadUpdateDeleteVhuAgrement(user, receipt);
    return prisma.vhuAgrement.update({
      data: removeEmptyKeys(data),
      where: { id: receipt.id }
    });
  };

export default updateVhuAgrementResolver;
