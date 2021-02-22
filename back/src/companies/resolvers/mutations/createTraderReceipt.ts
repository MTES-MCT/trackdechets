import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { receiptSchema } from "../../validation";

/**
 * Create a trader receipt
 * @param input
 */
const createTraderReceiptResolver: MutationResolvers["createTraderReceipt"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAuthenticated(context);
  const { input } = args;
  await receiptSchema.validate(input);
  return prisma.traderReceipt.create({ data: input });
};

export default createTraderReceiptResolver;
