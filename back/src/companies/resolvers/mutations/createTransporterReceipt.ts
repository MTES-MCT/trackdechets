import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
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
  return prisma.transporterReceipt.create({
    data: input
  });
};

export default createTransporterReceiptResolver;
