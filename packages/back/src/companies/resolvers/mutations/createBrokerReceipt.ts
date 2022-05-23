import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "@trackdechets/codegen/src/back.gen";
import { receiptSchema } from "../../validation";

/**
 * Create a broker receipt
 * @param input
 */
const createBrokerReceiptResolver: MutationResolvers["createBrokerReceipt"] =
  async (parent, args, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAuthenticated(context);
    const { input } = args;
    await receiptSchema.validate(input);
    return prisma.brokerReceipt.create({ data: input });
  };

export default createBrokerReceiptResolver;
