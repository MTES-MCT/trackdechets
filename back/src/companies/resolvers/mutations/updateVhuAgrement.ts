import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getVhuAgrementOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteVhuAgrement } from "../../permissions";

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
      data,
      where: { id: receipt.id }
    });
  };

export default updateVhuAgrementResolver;
