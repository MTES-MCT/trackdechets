import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
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
