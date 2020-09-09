import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { AuthType, applyAuthStrategies } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getTraderReceiptOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteTraderReceipt } from "../../permissions";
import { receiptSchema } from "../../validation";

/**
 * Update a trader receipt
 * @param input
 */
const updateTraderReceiptResolver: MutationResolvers["updateTraderReceipt"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const {
    input: { id, ...data }
  } = args;
  const receipt = await getTraderReceiptOrNotFound({ id });
  await receiptSchema.validate({ ...receipt, ...data });
  await checkCanReadUpdateDeleteTraderReceipt(user, receipt);
  return prisma.updateTraderReceipt({ data, where: { id: receipt.id } });
};

export default updateTraderReceiptResolver;
