import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { receiptSchema } from "../../validation";

/**
 * Create a transporter receipt
 * @param input
 */
const createTransporterReceiptResolver: MutationResolvers["createTransporterReceipt"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAuthenticated(context);
  const { input } = args;
  await receiptSchema.validate(input);
  return prisma.createTransporterReceipt(input);
};

export default createTransporterReceiptResolver;
