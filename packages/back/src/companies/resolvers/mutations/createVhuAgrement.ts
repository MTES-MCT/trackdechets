import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "@trackdechets/codegen/src/back.gen";

/**
 * Create a trader receipt
 * @param input
 */
const createVhuAgrementResolver: MutationResolvers["createVhuAgrement"] =
  async (_, args, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAuthenticated(context);
    const { input } = args;
    return prisma.vhuAgrement.create({ data: input });
  };

export default createVhuAgrementResolver;
